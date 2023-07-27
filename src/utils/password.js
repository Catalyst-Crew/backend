const saltRounds = 10;
const bcrypt = require('bcrypt');

const getNewPassword = () => {
    const length = 16;
    const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$&?"';
    const alphabetLength = alphabet.length;
    let newPassword = '';
    for (let i = 0; i < length; i++) {
        newPassword += alphabet.charAt(Math.floor(Math.random() * alphabetLength));
    }
    return newPassword;
}

const hashPassword = (password) => {
    return bcrypt.hashSync(password, saltRounds);
}

const verifyPassword = (password, dbPassword) => {
    return bcrypt.compareSync(password, dbPassword);
}

module.exports = { getNewPassword, hashPassword, verifyPassword };