# IPFS Image Viewing Guide

## Overview

Patient medical images are encrypted before being uploaded to IPFS for security. This means the raw IPFS gateway URLs (`https://gateway.pinata.cloud/ipfs/QmXXX...`) will download encrypted binary files that cannot be viewed as images directly.

## Solution: Decrypted Image Viewing

### New Endpoint

**GET** `/api/ipfs/view/:patientId/:modality`

This endpoint decrypts and serves images from IPFS.

#### Parameters
- `patientId` - Patient UUID
- `modality` - Image type: `xray`, `histopathology`, or `ultrasound`
- `hospital_id` (optional query) - Hospital ID for verification

#### Example Usage

```
GET http://localhost:3000/api/ipfs/view/5f52c851-1a47-47bd-84c6-41a2099a0ad3/xray
GET http://localhost:3000/api/ipfs/view/5f52c851-1a47-47bd-84c6-41a2099a0ad3/histopathology
GET http://localhost:3000/api/ipfs/view/5f52c851-1a47-47bd-84c6-41a2099a0ad3/ultrasound
```

### How It Works

1. **Retrieves** patient record from database
2. **Downloads** encrypted file from IPFS using the stored CID
3. **Decrypts** the file using AES-256-GCM encryption service
4. **Serves** the decrypted image with proper content type headers
5. **Caches** the image in browser (1 hour cache)

### Updated IPFS Upload Response

When uploading patient images to IPFS, you now receive both raw and viewing URLs:

```json
{
  "success": true,
  "patientId": "5f52c851-1a47-47bd-84c6-41a2099a0ad3",
  "ipfsCids": {
    "xray": "QmR9Qd34uFpNtXp8G1nq1884MKgSzfxN2FRcJrXXDczj5t",
    "histopathology": "QmZvkVmwCFFBfNiGT8Lz8e4kCeqxzf6HjyLCqCgWygBTAz",
    "ultrasound": "QmZpozb7t85n98xRiYTcAQgyZVZyXifgRFnswe9rCv5LjD"
  },
  "ipfsGatewayUrls": {
    "xray": "https://gateway.pinata.cloud/ipfs/QmR9Qd34uFpNtXp8G1nq1884MKgSzfxN2FRcJrXXDczj5t",
    "histopathology": "https://gateway.pinata.cloud/ipfs/QmZvkVmwCFFBfNiGT8Lz8e4kCeqxzf6HjyLCqCgWygBTAz",
    "ultrasound": "https://gateway.pinata.cloud/ipfs/QmZpozb7t85n98xRiYTcAQgyZVZyXifgRFnswe9rCv5LjD"
  },
  "decryptedViewUrls": {
    "xray": "http://localhost:3000/api/ipfs/view/5f52c851-1a47-47bd-84c6-41a2099a0ad3/xray",
    "histopathology": "http://localhost:3000/api/ipfs/view/5f52c851-1a47-47bd-84c6-41a2099a0ad3/histopathology",
    "ultrasound": "http://localhost:3000/api/ipfs/view/5f52c851-1a47-47bd-84c6-41a2099a0ad3/ultrasound"
  }
}
```

### URL Types Explained

1. **ipfsGatewayUrls** - Raw encrypted files on IPFS (for download/backup)
2. **decryptedViewUrls** - Viewable images through your backend (decrypted on-the-fly)

### Security Features

- ✅ Images are encrypted before IPFS upload
- ✅ Decryption requires access to your backend server
- ✅ Decryption key is stored securely in environment variables
- ✅ Hospital ID verification prevents unauthorized access
- ✅ No unencrypted data stored on IPFS

### Content Type Support

Automatically detects and serves proper content types:
- `.jpg` / `.jpeg` → `image/jpeg`
- `.png` → `image/png`
- `.gif` → `image/gif`
- `.webp` → `image/webp`
- `.bmp` → `image/bmp`
- `.tiff` / `.tif` → `image/tiff`

## Testing

You can test by opening the `decryptedViewUrls` in a browser - they should display as images:

```bash
# View X-Ray image
curl http://localhost:3000/api/ipfs/view/5f52c851-1a47-47bd-84c6-41a2099a0ad3/xray --output xray.jpg

# Or open in browser
open http://localhost:3000/api/ipfs/view/5f52c851-1a47-47bd-84c6-41a2099a0ad3/xray
```

## Environment Variables Required

```env
ENCRYPTION_KEY=your-32-byte-hex-key
IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
BASE_URL=http://localhost:3000
```
