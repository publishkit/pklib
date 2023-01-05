import * as Global from './global'
import * as Crypto from './crypto'
import * as Object from './object'
import * as Array from './array'
import * as String from './string'
import * as Dom from './dom'
import FS from './fs'
import * as File from './file'
import * as Node from './node'
import * as MarkDown from './markdown'
import * as Web from './web'
// import * as Dom from './dom'
// import * as Misc from './misc'
// import * as Number from './number'
// import './jquery'

const utils = {
    g: Global,
    c: Crypto,
    o: Object,
    a: Array,
    s: String,
    dom: Dom,
    fs: FS,
    file: File,
    node: Node,
    md: MarkDown
    // d: Dom,
    // m : Misc,
    // n: Number
}

// @ts-ignore
if(Node.isBrowser()) utils.w = Web

export default utils