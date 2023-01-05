interface Window {
    [key: string]: any
}

interface ObjectAny {
    [key: string]: any
}

interface Asset {
	path: string;
	filename: string;
	ext: string;
	subpath: string;
	hash: string;
	type: string;
	src?: string;
	url?: string;
	content?: string;
	err?: string;
	html?: string;
}

interface IndexCache {
	md: ObjectAny;
	image: ObjectAny;
	pdf: ObjectAny;
	current: ObjectAny;
	error: ObjectAny;
}