/**
 * Created by pratiksanglikar on 03/03/16.
 */
var Crypto = require('crypto');
exports.encryptPassword = function (password) {
	var salt = "Bl@ckS@1t";
	var encryptedPassword = Crypto.createHash('sha1').update(password + salt).digest('hex');
	return encryptedPassword;
}