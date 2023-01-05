//@ts-ignore
import fs from "fs-extra"
//@ts-ignore
import Glob from "glob"
//@ts-ignore
import * as Filesize from "filesize"

export const glob = (regex: string, opt?: any): Promise<string[]> => new Promise((solve,reject) => {
    Glob(regex, opt, (err: any, files: any) => {
        if(err) reject(err)
        else solve(files)
    })
})

export const prettySize = (s: number) => Filesize.filesize(s, {base: 2, standard: "jedec"})

export const buildIndex = async (path: string, { cwd }: any = {}, tree: any = []) => {
    const files: any = await glob(path, { cwd })

    files.map((file: any) => {
        const stat = fs.statSync(cwd+'/'+file)
        
        tree.push([
            file,
            stat.birthtime,
            stat.size,
            prettySize(stat.size),
            file.split('.').pop()
        ])
    })

    return tree.sort((a: any, b: any) => ((new Date(b[1]) as any) - (new Date(a[1]) as any)))
}

