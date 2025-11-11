const { MongoClient, ObjectId } = require('mongodb');
const logger = require('../utils/logger');
const encryptionService = require('./encryption');

class PatientService {
  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return;

    try {
      const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017';
      const dbName = process.env.MONGODB_DB_NAME || 'hospital_federated_learning';
      
      logger.info(`Connecting to MongoDB: ${mongoUrl}`);
      
      this.client = new MongoClient(mongoUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
      });
      
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.collection = this.db.collection('patients');
      
      // Create indexes
      await this.createIndexes();
      
      this.isConnected = true;
      logger.info('✓ Connected to MongoDB successfully');
      
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  async createIndexes() {
    try {
      // Create indexes for efficient querying
      await this.collection.createIndex({ 'id': 1 }, { unique: true });
      await this.collection.createIndex({ 'hospital_id': 1 });
      await this.collection.createIndex({ 'created_at': 1 });
      await this.collection.createIndex({ 'metadata.age': 1 });
      await this.collection.createIndex({ 'metadata.gender': 1 });
      await this.collection.createIndex({ 'metadata.diagnosis': 1 });
      
      logger.info('✓ Database indexes created');
      
    } catch (error) {
      logger.warn('Failed to create database indexes:', error.message);
    }
  }

  async createPatient(patientData) {
    await this.connect();

    try {
      const patient = {
        ...patientData,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
        status: 'active'
      };

      // Encrypt sensitive patient metadata if required
      if (process.env.ENCRYPT_PATIENT_DATA === 'true') {
        patient.metadata_encrypted = encryptionService.encryptObject(patient.metadata);
        delete patient.metadata; // Remove unencrypted version
        patient.encrypted = true;
      }

      const result = await this.collection.insertOne(patient);
      
      logger.info(`✓ Created patient record: ${patient.id}`);
      
      return {
        ...patient,
        _id: result.insertedId
      };
      
    } catch (error) {
      logger.error('Failed to create patient:', error);
      throw new Error(`Patient creation failed: ${error.message}`);
    }
  }

  async getPatients(options = {}) {
    await this.connect();

    try {
      const {
        page = 1,
        limit = 50,
        hospital_id,
        include_encrypted = false
      } = options;

      const filter = {};
      
      if (hospital_id) {
        filter.hospital_id = hospital_id;
      }

      // Don't include deleted patients
      filter.status = { $ne: 'deleted' };

      const skip = (page - 1) * limit;
      
      const projection = {
        _id: 0,
        id: 1,
        hospital_id: 1,
        created_at: 1,
        updated_at: 1,
        status: 1
      };

      // Include metadata based on encryption settings
      if (include_encrypted || process.env.ENCRYPT_PATIENT_DATA !== 'true') {
        projection.metadata = 1;
        projection.metadata_encrypted = 1;
        projection.encrypted = 1;
      }

      const patients = await this.collection
        .find(filter, { projection })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await this.collection.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      // Decrypt metadata if requested and encrypted
      if (include_encrypted) {
        for (const patient of patients) {
          if (patient.encrypted && patient.metadata_encrypted) {
            try {
              patient.metadata = encryptionService.decryptObject(patient.metadata_encrypted);
              delete patient.metadata_encrypted;
            } catch (error) {
              logger.warn(`Failed to decrypt metadata for patient ${patient.id}`);
            }
          }
        }
      }

      return {
        data: patients,
        page,
        limit,
        total,
        totalPages
      };

    } catch (error) {
      logger.error('Failed to fetch patients:', error);
      throw new Error(`Patient fetch failed: ${error.message}`);
    }
  }

  async getPatient(patientId, options = {}) {
    await this.connect();

    try {
      const {
        hospital_id,
        include_features = false,
        decrypt = false
      } = options;

      const filter = { id: patientId, status: { $ne: 'deleted' } };
      
      if (hospital_id) {
        filter.hospital_id = hospital_id;
      }

      const projection = { _id: 0 };
      
      if (!include_features) {
        projection.features = 0; // Exclude large feature data
      }

      const patient = await this.collection.findOne(filter, { projection });

      if (!patient) {
        return null;
      }

      // Decrypt metadata if requested and encrypted
      if (decrypt && patient.encrypted && patient.metadata_encrypted) {
        try {
          patient.metadata = encryptionService.decryptObject(patient.metadata_encrypted);
          delete patient.metadata_encrypted;
        } catch (error) {
          logger.warn(`Failed to decrypt metadata for patient ${patientId}`);
        }
      }

      return patient;

    } catch (error) {
      logger.error(`Failed to fetch patient ${patientId}:`, error);
      throw new Error(`Patient fetch failed: ${error.message}`);
    }
  }

  async updatePatientFeatures(patientId, features) {
    await this.connect();

    try {
      const updateData = {
        features: features,
        updated_at: new Date(),
        $inc: { version: 1 }
      };

      const result = await this.collection.updateOne(
        { id: patientId, status: { $ne: 'deleted' } },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        throw new Error('Patient not found');
      }

      logger.info(`✓ Updated features for patient: ${patientId}`);
      
      return true;

    } catch (error) {
      logger.error(`Failed to update patient features ${patientId}:`, error);
      throw new Error(`Feature update failed: ${error.message}`);
    }
  }

  async updatePatient(patientId, updateData, options = {}) {
    await this.connect();

    try {
      const { hospital_id } = options;
      
      const filter = { id: patientId, status: { $ne: 'deleted' } };
      
      if (hospital_id) {
        filter.hospital_id = hospital_id;
      }

      const update = {
        ...updateData,
        updated_at: new Date(),
        $inc: { version: 1 }
      };

      // Encrypt metadata if required
      if (update.metadata && process.env.ENCRYPT_PATIENT_DATA === 'true') {
        update.metadata_encrypted = encryptionService.encryptObject(update.metadata);
        delete update.metadata;
        update.encrypted = true;
      }

      const result = await this.collection.updateOne(filter, { $set: update });

      if (result.matchedCount === 0) {
        throw new Error('Patient not found');
      }

      logger.info(`✓ Updated patient: ${patientId}`);
      
      return true;

    } catch (error) {
      logger.error(`Failed to update patient ${patientId}:`, error);
      throw new Error(`Patient update failed: ${error.message}`);
    }
  }

  async deletePatient(patientId, options = {}) {
    await this.connect();

    try {
      const { hospital_id, secure_delete = true } = options;
      
      const filter = { id: patientId, status: { $ne: 'deleted' } };
      
      if (hospital_id) {
        filter.hospital_id = hospital_id;
      }

      // Get patient data for file cleanup
      const patient = await this.collection.findOne(filter);
      
      if (!patient) {
        return { deleted: false, reason: 'Patient not found' };
      }

      let filesRemoved = 0;

      // Clean up associated files
      if (patient.files && secure_delete) {
        for (const [modality, fileList] of Object.entries(patient.files)) {
          if (Array.isArray(fileList)) {
            for (const file of fileList) {
              try {
                // Securely delete files
                if (file.path) {
                  await encryptionService.secureDelete(file.path);
                  filesRemoved++;
                }
                if (file.encrypted_path) {
                  await encryptionService.secureDelete(file.encrypted_path);
                  filesRemoved++;
                }
              } catch (error) {
                logger.warn(`Failed to delete file ${file.path}:`, error.message);
              }
            }
          }
        }
      }

      // Soft delete (mark as deleted instead of removing)
      const result = await this.collection.updateOne(
        filter,
        {
          $set: {
            status: 'deleted',
            deleted_at: new Date(),
            updated_at: new Date()
          },
          $inc: { version: 1 }
        }
      );

      logger.info(`✓ Deleted patient: ${patientId} (${filesRemoved} files removed)`);
      
      return {
        deleted: true,
        files_removed: filesRemoved
      };

    } catch (error) {
      logger.error(`Failed to delete patient ${patientId}:`, error);
      throw new Error(`Patient deletion failed: ${error.message}`);
    }
  }

  async getPatientStatistics(hospitalId) {
    await this.connect();

    try {
      const pipeline = [
        {
          $match: {
            hospital_id: hospitalId,
            status: { $ne: 'deleted' }
          }
        },
        {
          $group: {
            _id: null,
            total_patients: { $sum: 1 },
            avg_age: { $avg: '$metadata.age' },
            gender_distribution: {
              $push: '$metadata.gender'
            },
            diagnoses: {
              $push: '$metadata.diagnosis'
            }
          }
        }
      ];

      const result = await this.collection.aggregate(pipeline).toArray();
      
      if (result.length === 0) {
        return {
          total_patients: 0,
          avg_age: 0,
          gender_distribution: {},
          diagnosis_distribution: {}
        };
      }

      const stats = result[0];
      
      // Process gender distribution
      const genderCount = {};
      stats.gender_distribution.forEach(gender => {
        genderCount[gender] = (genderCount[gender] || 0) + 1;
      });

      // Process diagnosis distribution
      const diagnosisCount = {};
      stats.diagnoses.forEach(diagnosis => {
        if (diagnosis) {
          diagnosisCount[diagnosis] = (diagnosisCount[diagnosis] || 0) + 1;
        }
      });

      return {
        total_patients: stats.total_patients,
        avg_age: Math.round(stats.avg_age * 100) / 100,
        gender_distribution: genderCount,
        diagnosis_distribution: diagnosisCount
      };

    } catch (error) {
      logger.error('Failed to get patient statistics:', error);
      throw new Error(`Statistics fetch failed: ${error.message}`);
    }
  }

  async close() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      logger.info('✓ Disconnected from MongoDB');
    }
  }
}

// Export singleton instance
const patientService = new PatientService();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await patientService.close();
});

process.on('SIGINT', async () => {
  await patientService.close();
});

module.exports = patientService;