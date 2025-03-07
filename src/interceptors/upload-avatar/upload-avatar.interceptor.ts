import { Injectable } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Request } from 'express';
import { allowedExtensions, AVATAR_SIZE_LIMIT } from './constants';
import { extname, join } from 'path';

@Injectable()
export class UploadAvatarInterceptor extends FileInterceptor('avatar', {
	storage: diskStorage({
		destination: join(__dirname, '../../../avatars'),
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
		fileSize: AVATAR_SIZE_LIMIT,
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
		if (!allowedExtensions.includes(extname(file.originalname))) {
			return callback(null, false);
		}
		callback(null, true);
	},
}) {}
