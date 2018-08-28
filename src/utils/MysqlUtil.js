var mysql = require('mysql');
var extend = require('extend');

module.exports = MysqlUtil;

function MysqlUtil() {
    if (!(this instanceof MysqlUtil))
        return new MysqlUtil();
    this.connection = undefined;
}

MysqlUtil.prototype.connect = function (cb, connOptions) {
    var self = this;
    var connectionOptions = {
        host: "localhost",
        user: "ideploy",
        password: "ideploy",
        database: "ideploy"
    };
    extend(connectionOptions, connOptions);

    if (!self.connection) {
        self.connection = mysql.createConnection(connectionOptions);
        self.connection.connect(function (err) {
            if (err) {
                throw err;
            }
            if (cb) {
                cb();
            }
        });
    } else {
        if (cb) {
            cb();
        }
    }

};

MysqlUtil.prototype.query = function (stmt, cb, connOptions, isQuery = true) {
    var self = this;
    self.connect(function () {
        self.connection.query(stmt, function (error, results, fields) {            
            if (error) {
                throw error;
            }            
            if (cb) {                
                cb(results);
            }
        });
    }, connOptions);
};


MysqlUtil.prototype.close = function () {
    var self = this;
    self.connection.end();
    self.connection = null;
};