import Splitter from "./Splitter";

import xmlParser from "xml2js";

class Sparrow extends Splitter {
    static check(data, cb) {
        try {
            xmlParser.parseString(data, (err, atlas) => {
                if (err) {
                    cb(false);
                    return;
                }

                cb(
                    atlas.TextureAtlas &&
                        Array.isArray(atlas.TextureAtlas.sprite),
                );
            });
        } catch (e) {
            cb(false);
        }
    }

    static split(data, options, cb) {
        let res = [];

        try {
            xmlParser.parseString(data, (err, atlas) => {
                if (err) {
                    cb(res);
                    return;
                }

                let list = atlas.TextureAtlas.SubTexture;

                for (let item of list) {
                    item = item["$"];

                    if (isNaN(item.frameX)) item.frameX = 0;
                    if (isNaN(item.frameY)) item.frameY = 0;
                    if (isNaN(item.frameWidth)) item.frameWidth = item.width;
                    if (isNaN(item.frameHeight)) item.frameHeight = item.height;

                    item.x *= 1;
                    item.y *= 1;
                    item.width *= 1;
                    item.height *= 1;
                    item.frameX *= -1;
                    item.frameY *= -1;
                    item.frameWidth *= 1;
                    item.frameHeight *= 1;

                    let trimmed = item.w < item.oW || item.h < item.oH;

                    res.push({
                        name: Splitter.fixFileName(item.name),
                        frame: {
                            x: item.x,
                            y: item.y,
                            w: item.width,
                            h: item.height,
                        },
                        spriteSourceSize: {
                            x: item.frameX,
                            y: item.frameY,
                            w: item.width,
                            h: item.height,
                        },
                        sourceSize: {
                            w: item.frameWidth,
                            h: item.frameHeight,
                        },
                        rotated: item.rotated === "true",
                        trimmed: trimmed,
                    });
                }

                cb(res);
            });
        } catch (e) {}

        cb(res);
    }

    static get type() {
        return "Sparrow/Starling";
    }
}

export default Sparrow;
