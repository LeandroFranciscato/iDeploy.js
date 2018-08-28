[![Build Status](https://travis-ci.org/LeandroFranciscato/iDeploy.js.svg?branch=master)](https://travis-ci.org/LeandroFranciscato/iDeploy.js)

# iDeploy.js
A simple way to build and deploy your projects, using Node.js and GNU/Linux.

## Setting up your project

Well, by adding some instructions into the `Project` table, you're be able to configure your build and deploy proccess. e.g:

| id | nome         | gitRepository           | gitUser | gitPassword | buildScript                                                                | deployScript                                                          |
|----|--------------|-------------------------|---------|-------------|----------------------------------------------------------------------------|-----------------------------------------------------------------------|
| 1  | aWebProject  | github.com/aWebProject  | user    | *****       | npm install && gulp build                                                  | gulp deploy                                                           |
| 2  | aJavaProject | github.com/aJavaProject | user    | *****       | apt install maven -y && mvn clean                                          | mvn install                                                           |
| 3  | anyOther     | github.com/anyOther     | user    | *****       | ssh root@192.168.2.1 " pkill -f anyOther.sh < /dev/null > log.log 2>&1 &"  | ssh root@192.168.2.1 " bash anyOther.sh < /dev/null > log.log 2>&1 &" |

After that, you have to configure your ssh connection with your targets, using the table `ProjetoServer`.
Of course that a non-prompt-password login will be required for it to work as we hope, so, [here](https://gist.github.com/LeandroFranciscato/f46caabdf744709ce4541f1eb29aafbe) is a easy way to setup ssh keys between your deploy server and your targets.

### Running

Just type `node iDeploy.js` in the root directory of the project.

After that, we're able to make it happen. Just inserting some lines into the table `Atualizacao` and the magic happens. e.g:

| id | idProjeto | descricao           | data                | situacao |
|----|-----------|---------------------|---------------------|----------|
| 1  | 1         | Any description     | 2018-08-31 15:00:00 | Pendente |
| 2  | 1         | Another description | null                | Pendente |

In these examples, the `iDeploy.js` will download the git repository and run the commands that you've set up.
If you have any doubt about how it really works, take a look at the [main controller](https://github.com/LeandroFranciscato/iDeploy.js/blob/master/src/controller/Deploy.js) and its methods.

### Known issues
- There isn't user interface.
- Improve the runSQL method on Deploy.js, parameters are fixed.
- Create a xml file with the informations of the mysql login/pass/db.

### License
[MIT Licence](https://github.com/LeandroFranciscato/iDeploy.js/blob/master/LICENSE)

### Dependencies
- ["node": "^6.9.5"](https://nodejs.org/en/)
- ["extend": "^3.0.2"](https://www.npmjs.com/package/extend)
- ["file-system": "^2.2.2"](https://www.npmjs.com/package/file-system)
- ["mysql": "^2.16.0"](https://www.npmjs.com/package/mysql)
- ["read-text-file": "^1.1.0"](https://www.npmjs.com/package/read-text-file)
- ["shelljs": "^0.8.2"](https://www.npmjs.com/package/shelljs)
- ["node-datetime": "^2.0.9"](https://www.npmjs.com/package/node-datetime)

