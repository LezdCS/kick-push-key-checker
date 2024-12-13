import * as sass from 'sass'

export function compileSass(filepath: string): string {
	const result = sass.compile(filepath)
	return result.css
}
