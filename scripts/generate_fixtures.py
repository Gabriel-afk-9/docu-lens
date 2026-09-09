from docx import Document
import os, random, string

def rand_text(n):
    return ''.join(random.choices(string.ascii_letters + string.digits + ' ', k=n))

def make_fixture(path, target_bytes):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    doc = Document()
    doc.add_heading(f'Fixture {os.path.basename(path)}', 0)
    # Add content until size approx target
    # Each paragraph ~1000 chars -> ~1000 bytes raw, ~400 after zip
    # So need target*2.5 paragraphs
    est_paras = max(50, int(target_bytes / 400))
    # Limit to avoid huge time for 20MB (50000 paras)
    # Use larger paragraphs for big files
    para_size = 2000 if target_bytes > 5*1024*1024 else 1000
    for i in range(est_paras):
        p = doc.add_paragraph(rand_text(para_size))
        if i % 200 == 0 and i > 0:
            # Check size periodically to avoid overshoot
            tmp = path + ".tmp"
            doc.save(tmp)
            sz = os.path.getsize(tmp)
            os.remove(tmp)
            if sz >= target_bytes * 0.95:
                break
    doc.save(path)
    print(f"{path}: {os.path.getsize(path)/1024/1024:.2f} MB")

targets = [
    ("assets/fixtures/docx/benchmark/bench-1MB.docx", 1*1024*1024),
    ("assets/fixtures/docx/benchmark/bench-10MB.docx", 10*1024*1024),
    ("assets/fixtures/docx/benchmark/bench-20MB.docx", 20*1024*1024),
    ("assets/fixtures/docx/benchmark/bench-25MB.docx", 25*1024*1024),
]

for p, sz in targets:
    if os.path.exists(p):
        print(f"exists {p} {os.path.getsize(p)/1024/1024:.2f} MB, skip")
        continue
    make_fixture(p, sz)

print("done")
