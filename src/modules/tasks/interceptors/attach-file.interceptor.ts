import { Injectable } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Request } from 'express';
import { FILE_SIZE_LIMIT } from './contstants';

@Injectable()
export class AttachFileInterceptor extends FileInterceptor('file', {
	storage: diskStorage({
		destination: join(__dirname, '../../../../attachedFiles'),
		filename(
			_req: Request,
			file: Express.Multer.File,
			callback: (error: Error | null, filename: string) => void,
		) {
			const uniqueSuffix = Date.now();
			const ext = extname(file.originalname);
			const filename = `${file.originalname.split('.')[0].replace(/\s+/g, '_')}-${uniqueSuffix}${ext}`;

			callback(null, filename);
		},
	}),
	limits: {
		fileSize: FILE_SIZE_LIMIT,
	},
	fileFilter(
		_req: Request,
		file: {
			fieldname: string;
			originalname: string;
			encoding: string;
			mimetype: string;
			size: number;
			destination: string;
			filename: string;
			path: string;
			buffer: Buffer;
		},
		callback: (error: Error | null, acceptFile: boolean) => void,
	) {
		callback(null, true);
	},
}) {}
