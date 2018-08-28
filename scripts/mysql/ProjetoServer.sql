create table ProjetoServer(
id int primary key auto_increment,
idProjeto int not null,
tipo varchar(1000) not null,
ip varchar(1000) not null,
user varchar(1000) not null,
password varchar(1000) not null,
directory varchar(1000) not null
);
