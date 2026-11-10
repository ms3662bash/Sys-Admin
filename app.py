from flask import Flask, request, send_from_directory
import logging
import hashlib

app = Flask(__name__)

# Log registration attempts to register.log
logging.basicConfig(
    filename="register.log",
    level=logging.INFO,
    format="%(asctime)s - %(message)s"
)

@app.route("/")
def home():
    return send_from_directory(".", "register.html")

@app.route("/login")
def login_page():
    return send_from_directory(".", "login.html")

@app.route("/register", methods=["POST"])
def register():
    username = request.form.get("username")
    email = request.form.get("email")
    password = request.form.get("password")

    # Don't log the real password. Log a hash so the log is safe to read
    # but entries can still be told apart.
    password_hash = hashlib.sha256(password.encode()).hexdigest()

    logging.info(f"username={username} email={email} password_hash={password_hash}")

    return "Registered Successfully!"

@app.route("/login", methods=["POST"])
def login():
    username = request.form.get("username")
    password = request.form.get("password")
    
    # hash password for login verification logging as well
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    logging.info(f"LOGIN ATTEMPT: username={username} password_hash={password_hash}")
    
    return "Login Successful!"

if __name__ == "__main__":
    app.run(debug=True)