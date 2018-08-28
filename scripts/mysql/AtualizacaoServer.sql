create table AtualizacaoServer(
id int primary key auto_increment,
idAtualizacao int not null,
idProjetoServer int not null,
data date
);

alter table AtualizacaoServer 
modify data datetime null;

alter table AtualizacaoServer 
add hasErrors boolean;

