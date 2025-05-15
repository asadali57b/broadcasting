class user_services {
    async sendEmail(to, subject, text) {
          console.log(`To: ${to}\nSubject: ${subject}\nMessage: ${text}`);

    }
}

module.exports = new user_services();