import frontMatter from "front-matter";

export const parseFrontmatter = (s: string) => {
  const parse = frontMatter(s);
  const frontmatter = parse.attributes as ObjectAny;
  const body = parse.body as string;
  return { frontmatter, body };
};
