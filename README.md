# Tex-Packer-EX
![logo](https://raw.githubusercontent.com/odrick/free-tex-packer/master/electron/build/icons/96x96.png)
#

Tex-Packer-EX is a fork of [Free texture packer](https://github.com/odrick/free-tex-packer) which adds new features and bug fixes, including:
- The ability to repack existing spritesheets
- Splitter for Sparrow/Starling spritesheets (the standard format for FNF)
- Correctly ordered frames when exporting

This was primarily created with Friday Night Funkin' modding in mind, however it can be used for any other project.


# Free texture packer

>[!CAUTION]
All links and references to the Free Texture Packer website (free-tex-packer dot com) have been removed, as the developers likely no longer own the domain. Do not visit this domain, as it will redirect you to a malicious website.

Free texture packer creates sprite sheets for your game or site. Rotation, trimming, multipacking, various export formats (json, xml, css, pixi.js, godot, phaser, cocos2d). Zip support. TinyPNG support. Split sheet tool.

![screenshot](./screenshot.png)

Homepage: [redacted]

Web version: [redacted]

Desktop versions for win, mac, linux: [https://github.com/odrick/free-tex-packer/releases](https://github.com/odrick/free-tex-packer/releases)

Gulp module: [https://github.com/odrick/gulp-free-tex-packer](https://github.com/odrick/gulp-free-tex-packer)

Grunt plugin: [https://github.com/odrick/grunt-free-tex-packer](https://github.com/odrick/grunt-free-tex-packer)

Webpack plugin: [https://github.com/odrick/webpack-free-tex-packer](https://github.com/odrick/webpack-free-tex-packer)

CLI: [https://github.com/odrick/free-tex-packer-cli](https://github.com/odrick/free-tex-packer-cli)

# Custom templates
Free texture packer uses [mustache](http://mustache.github.io/) template engine.

There are 3 objects passed to template:

**rects** (Array) list of sprites for export

| prop             | type    | description                     |
| ---              | ---     | ---                             |
| name             | String  | sprite name                     |
| frame            | Object  | frame info (x, y, w, h, hw, hh) |
| rotated          | Boolean | sprite rotation flag            |
| trimmed          | Boolean | sprite trimmed flag             |
| spriteSourceSize | Object  | sprite source size (x, y, w, h) |
| sourceSize       | Object  | original size (w, h)            |
| first            | Boolean | first element in array flag     |
| last             | Boolean | last element in array flag      |

**config** (Object) current export config

| prop           | type    | description                        |
| ---            | ---     | ---                                |
| imageWidth     | Number  | texture width                      |
| imageHeight    | Number  | texture height                     |
| scale          | Number  | texture scale                      |
| format         | String  | texture format                     |
| imageName      | String  | texture name                       |
| imageFile      | String  | texture file (name with extension) |
| base64Export   | Boolean | base64 export flag                 |
| base64Prefix   | String  | prefix for base64 string           |
| imageData      | String  | base64 image data                  |

**appInfo** (Object) application info

| prop           | type    | description          |
| ---            | ---     | ---                  |
| displayName    | String  | App name             |
| version        | String  | App version          |
| url            | String  | App url              |

**Example:**
```
{
  "frames": {
    {{#rects}}
    "{{{name}}}": {
      "frame": {
        "x": {{frame.x}},
        "y": {{frame.y}},
        "w": {{frame.w}},
        "h": {{frame.h}}
      },
      "rotated": {{rotated}},
      "trimmed": {{trimmed}},
      "spriteSourceSize": {
        "x": {{spriteSourceSize.x}},
        "y": {{spriteSourceSize.y}},
        "w": {{spriteSourceSize.w}},
        "h": {{spriteSourceSize.h}}
      },
      "sourceSize": {
        "w": {{sourceSize.w}},
        "h": {{sourceSize.h}}
      },
      "pivot": {
        "x": 0.5,
        "y": 0.5
      }
    }{{^last}},{{/last}}
    {{/rects}}
  },
  "meta": {
    "app": "{{{appInfo.url}}}",
    "version": "{{appInfo.version}}",
    "image": "{{config.imageFile}}",
    "format": "{{config.format}}",
    "size": {
      "w": {{config.imageWidth}},
      "h": {{config.imageHeight}}
    },
    "scale": {{config.scale}}
  }
}
```
