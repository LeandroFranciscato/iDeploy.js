
create table Projeto(
id int primary key auto_increment,
nome varchar(1000) not null,
gitRepository varchar(1000) not null,
gitUser varchar(1000) not null,
gitPassword varchar(1000),
preBuildScript varchar(1000), 
buildScript varchar(1000),
preDeployScript varchar(1000), 
deployScript varchar(1000)
);

alter table Projeto
add userMysql varchar(1000),
add passwordMysql varchar(1000),
add dbMysql varchar(1000);

alter table Projeto
add posDeployScript varchar(1000);
