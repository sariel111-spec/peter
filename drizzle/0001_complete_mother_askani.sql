CREATE TABLE `walls` (
	`owner` text PRIMARY KEY NOT NULL,
	`doc` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated` text NOT NULL
);
