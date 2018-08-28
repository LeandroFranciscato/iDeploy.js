const fs = require('file-system');
var dateTime = require('node-datetime');
var shell = require('shelljs');
var readTextFile = require('read-text-file');
var mysqlUtil = require('../utils/MysqlUtil')();

module.exports = Deploy;

function Deploy() {
    if (!(this instanceof Deploy))
        return new Deploy();
    this.logText = "";
    this.stop = false;
    this.running = false;
    this.errorGeral = false;
    this.errorServer = false;
}

Deploy.prototype.start = function () {
    var self = this;
    var loop = setInterval(function () {
        while (self.running) {
            return "";
        }
        self.logText = "";
        self.errorGeral = false;
        mysqlUtil.query(""
                + " select Projeto.id idProjeto, "
                + "        Atualizacao.id idAtualizacao, "
                + "        Atualizacao.situacao, "
                + "        Projeto.nome nomeProjeto, "
                + "        Projeto.gitRepository, "
                + "        Projeto.gitUser, "
                + "        Projeto.gitPassword, "
                + "        Projeto.preBuildScript, "
                + "        Projeto.buildScript, "
                + "        Projeto.preDeployScript, "
                + "        Projeto.deployScript, "
                + "        Projeto.posDeployScript, "
                + "        Atualizacao.diretorioSQL, "
                + "        Projeto.userMysql, "
                + "        Projeto.passwordMysql, "
                + "        Projeto.dbMysql "
                + "   from Projeto "
                + "   join Atualizacao on Projeto.id = Atualizacao.idProjeto"
                + "  where Atualizacao.situacao in ('Pendente', 'Em andamento') "
                + "    and (Atualizacao.data is null or Atualizacao.data <= now()) "
                + "  order by Projeto.id, "
                + "           Atualizacao.id "
                + "  limit 0,1",
                function (projetos) {
                    for (var i = 0; i < projetos.length; i++) {
                        self.running = true;
                        self.build(projetos[i]);
                    }
                }
        );

        if (self.stop) {
            clearInterval(loop);
            mysqlUtil.close();
        }
    }, 2000);
};

Deploy.prototype.build = function (projeto) {
    var self = this;
    mysqlUtil.query("update Atualizacao set situacao = 'Em andamento' where id = " + projeto.idAtualizacao);
    var dir = "./rep/" + projeto.nomeProjeto;

    self.git(projeto, dir);

    var ran = "";
    if (projeto.preBuildScript) {
        try {
            ran = shell.exec(projeto.preBuildScript);
            self.log("Pre-build concluído: " + ran, projeto.idAtualizacao);
        } catch (e) {
            self.err(e, projeto.idAtualizacao);
        }
    }

    if (projeto.buildScript) {
        try {
            shell.cd(dir);
            ran = shell.exec(projeto.buildScript);
            self.log("Build concluído: " + ran, projeto.idAtualizacao);
            shell.cd("..");
            shell.cd("..");
        } catch (e) {
            self.err(e, projeto.idAtualizacao);
        }
    }
    self.deploy(projeto, dir);
};

Deploy.prototype.git = function (projeto, dir) {
    var self = this;
    var cmd = "";
    var ran = shell.cd(dir);
    try {
        if (ran && ran.stderr && ran.stderr.indexOf("no such") >= 0) {
            cmd = "git clone https://" + projeto.gitUser + ":" + projeto.gitPassword + "@" + projeto.gitRepository + " " + dir + " --depth 1";
            ran = shell.exec(cmd);
        } else {
            cmd = "git stash && git pull origin master";
            ran = shell.exec(cmd);
            shell.cd("..");
            shell.cd("..");
        }
        self.log("Repositório Atualizado: " + ran, projeto.idAtualizacao);
    } catch (e) {
        self.err(e, projeto.idAtualizacao);
    }
};

Deploy.prototype.deploy = function (projeto, dir) {
    var self = this;
    var ran = "";
    /*As condições para o server ser listado são
     * 
     * 1 - Não existir linhas na AtualizacaoServer para este server nesta atualização &&
     *     Não existir linhas na AtualizacaoServer para este server em atualizações anteriores que possua erros
     * 2 - Existir linhas na AtualizacaoServer para este server nesta atualização que possua erros
     */
    mysqlUtil.query(""
            + "select * "
            + "  from ProjetoServer "
            + " where idProjeto = " + projeto.idProjeto
            + "   and ((not exists (select 1 from AtualizacaoServer where idProjetoServer = ProjetoServer.id and idAtualizacao = " + projeto.idAtualizacao + ") "
            + "   and not exists (select 1 from AtualizacaoServer where idProjetoServer = ProjetoServer.id and idAtualizacao < " + projeto.idAtualizacao + " and hasErrors = true)) "
            + "    or exists (select 1 from AtualizacaoServer where idProjetoServer = ProjetoServer.id and idAtualizacao = " + projeto.idAtualizacao + " and hasErrors = true))"
            + "",
            function (servers) {
                for (var j = 0; j < servers.length; j++) {
                    var server = servers[j];
                    var logAtualizacaoServer = "";
                    self.errorServer = false;
                    if (projeto.preDeployScript) {
                        try {
                            ran = shell.exec(projeto.preDeployScript);
                            ran = "Pre-deploy concluído (" + server.ip + "): " + ran;
                            self.log(ran, projeto.idAtualizacao);
                            logAtualizacaoServer += self.formatMsg(ran);
                        } catch (e) {
                            logAtualizacaoServer += self.err(e, projeto.idAtualizacao, true);
                        }
                    }

                    if (projeto.deployScript) {
                        try {
                            shell.cd(dir);
                            ran = shell.exec(projeto.deployScript + " --user " + server.user + " --ip " + server.ip + " --directory " + server.directory);
                            ran = "Deploy concĺuído (" + server.ip + "): " + ran;
                            self.log(ran, projeto.idAtualizacao);
                            logAtualizacaoServer += self.formatMsg(ran);
                        } catch (e) {
                            logAtualizacaoServer += self.err(e, projeto.idAtualizacao, true);
                        }
                    }

                    if (projeto.posDeployScript) {
                        try {
                            ran = shell.exec(projeto.posDeployScript + " --user " + server.user + " --ip " + server.ip + " --directory " + server.directory);
                            ran = "Pós-Deploy concĺuído (" + server.ip + "): " + ran;
                            self.log(ran, projeto.idAtualizacao);
                            logAtualizacaoServer += self.formatMsg(ran);
                        } catch (e) {
                            logAtualizacaoServer += self.err(e, projeto.idAtualizacao, true);
                        }
                    }

                    if (projeto.diretorioSQL) {
                        logAtualizacaoServer += self.runSQL(projeto, server);
                    }

                    mysqlUtil.query(""
                            + "insert into AtualizacaoServer "
                            + "(idAtualizacao, idProjetoServer, data, log, hasErrors) "
                            + "values "
                            + "(" + projeto.idAtualizacao + ", " + server.id + ", now(), " + logAtualizacaoServer + ", " + self.errorServer + ")");

                    if (!self.errorServer) {
                        mysqlUtil.query("delete from AtualizacaoServer "
                                + "       where idAtualizacao = " + projeto.idAtualizacao
                                + "         and idProjetoServer = " + server.id
                                + "         and hasErrors = true");
                    }

                    shell.cd("..");
                    shell.cd("..");
                }
                if (!self.errorGeral) {
                    mysqlUtil.query("update Atualizacao set situacao = 'Finalizada' where id = " + projeto.idAtualizacao);
                }
                self.running = false;
            }
    );
};
Deploy.prototype.runSQL = function (projeto, server) {
    var self = this;
    var logSql = "";
    try {
        fs.recurseSync(projeto.diretorioSQL, function (filepath, relative, filename) {
            var sql = readTextFile.readSync(projeto.diretorioSQL + filename);
            var cmd = "ssh " + server.user + "@" + server.ip + " \"mysql -u " + projeto.userMysql + " -p" + projeto.passwordMysql + " " + projeto.dbMysql + " -e \\\"" + sql + "\\\" < /dev/null > logSql.log 2>&1 & \"";
            ran = shell.exec(cmd);
            ran = "Sql " + filename + " concluído (" + server.ip + "): " + ran;
            self.log(ran, projeto.idAtualizacao);
            logSql += self.formatMsg(ran);
        });
    } catch (e) {
        self.log("Erro" + e, projeto.idAtualizacao);
        logSql += self.formatMsg(e);
        self.errorGeral = true;
        self.errorServer = true;
    }
    return logSql;
};
Deploy.prototype.log = function (msg, idAtualizacao) {
    var self = this;
    self.logText += self.formatMsg(msg);
    var sql = "update Atualizacao set log = " + self.logText + " where id = " + idAtualizacao;
    mysqlUtil.query(sql);
};
Deploy.prototype.formatMsg = function (msg) {
    var self = this;
    var dt = dateTime.create();
    var formatted = dt.format('Y-m-d H:M:S');
    return mysqlUtil.connection.escape("\n" + formatted + " - " + msg);
};

Deploy.prototype.err = function (e, idAtualizacao, isServerErro = false) {
    var self = this;
    e = "Erro: " + e;
    self.log(e, idAtualizacao);
    self.errorGeral = true;
    if (isServerErro) {
        self.errorServer = true;
        return self.formatMsg(e);
}
};