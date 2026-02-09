const bcrypt = require('bcryptjs');

// Tu contraseña de admin
const password = 'Pipe16137356';

// Generar hash
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);
console.log('');

// Verificar
const isValid = bcrypt.compareSync(password, hash);
console.log('Verificación:', isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA');
