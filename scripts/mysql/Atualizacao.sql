create table Atualizacao(
id int primary key auto_increment,
idProjeto int not null,
descricao varchar(1000),
data date,
situacao varchar(1000),
diretorioSQL varchar(1000),
log longtext
);

alter table Atualizacao 
modify data datetime null;
