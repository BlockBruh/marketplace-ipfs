create table if not exists "IpfsHashes"
(
    "dropId"       integer not null
        primary key,
    "mediaHash"    varchar(255),
    "metadataHash" varchar(255),
    "uploadStatus" varchar(255)
);

insert into "IpfsHashes"
values (1, '1', '1', 'Done'),
       (2, '2', '2', 'InProgress'),
       (3, '3', '3', 'Failed');

select * from "IpfsHashes"

