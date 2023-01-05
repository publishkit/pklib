import frontMatter from "front-matter";

export const parseFrontmatter = (s: string) => {
  const parse = frontMatter(s);
  const frontmatter = parse.attributes;
  const body = parse.body;
  return { frontmatter, body };
};
