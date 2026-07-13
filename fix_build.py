with open('result/fedprox-result/build_notebook.py', 'r') as f:
    content = f.read()

# Fix the broken lines by replacing them with a properly escaped string
content = content.replace(
    '\'print(f"{\'Dataset\':<25s} {\'Benign\':>8s} {\'Malignant\':>10s} {\'Total\':>8s}")\\n\'',
    '"print(f\\"{\'Dataset\':<25s} {\'Benign\':>8s} {\'Malignant\':>10s} {\'Total\':>8s}\\")\\n"'
)

content = content.replace(
    '\'print(f"{\'TOTAL\':<25s} {total_b:>8d} {total_m:>10d} {total_b + total_m:>8d}")\\n\'',
    '"print(f\\"{\'TOTAL\':<25s} {total_b:>8d} {total_m:>10d} {total_b + total_m:>8d}\\")\\n"'
)

content = content.replace(
    '\'print(f"{\'Method\':<25s} {\'Accuracy\':>10s} {\'AUC-ROC\':>10s} {\'Loss\':>10s}")\\n\'',
    '"print(f\\"{\'Method\':<25s} {\'Accuracy\':>10s} {\'AUC-ROC\':>10s} {\'Loss\':>10s}\\")\\n"'
)

content = content.replace(
    '\'print(f"{\'Round\':>6s} {\'Accuracy\':>10s} {\'AUC-ROC\':>10s} {\'Loss\':>10s}")\\n\'',
    '"print(f\\"{\'Round\':>6s} {\'Accuracy\':>10s} {\'AUC-ROC\':>10s} {\'Loss\':>10s}\\")\\n"'
)

content = content.replace(
    '\'print(f"{\'μ\':>8s} {\'Accuracy\':>10s} {\'AUC-ROC\':>10s} {\'Loss\':>10s}")\\n\'',
    '"print(f\\"{\'μ\':>8s} {\'Accuracy\':>10s} {\'AUC-ROC\':>10s} {\'Loss\':>10s}\\")\\n"'
)

with open('result/fedprox-result/build_notebook.py', 'w') as f:
    f.write(content)
