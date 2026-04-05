import React from 'react';

import {Observer, GLOBAL_EVENT} from '../Observer';
import I18 from '../utils/I18';

import splitters, {getSplitterByData, getSplitterByType} from '../splitters';
import {getDefaultSplitter} from '../splitters';
import LocalImagesLoader from "../utils/LocalImagesLoader";
import ReactDOM from "react-dom";
import Downloader from "platform/Downloader";

var base64js = require('base64-js')

class SheetSplitter extends React.Component {
    constructor(props) {
        super(props);

        this.selectTextureInputRef = React.createRef();
        this.textureNameRef = React.createRef();
        this.dataFileNameRef = React.createRef();
        this.dataFormatRef = React.createRef();
        this.holdtrimRef = React.createRef();
        this.viewRef = React.createRef();
        this.widthRef = React.createRef();
        this.heightRef = React.createRef();
        this.paddingRef = React.createRef();
        
        this.textureBackColors = ["grid-back", "white-back", "pink-back", "black-back"];
        this.step = 0.1;

        this.state = {
            splitter: getDefaultSplitter(),
            textureBack: this.textureBackColors[0],
            scale: 1
        };

        this.rangeRef = React.createRef();
        this.wheelRef = React.createRef();

        this.texture = null;
        this.data = null;
        this.frames = null;
        
        this.textureName = '';
        this.dataName = '';

        this.buffer = document.createElement('canvas');
        
        this.repack = this.repack.bind(this);
        this.doSplit = this.doSplit.bind(this);
        this.getFiles = this.getFiles.bind(this);
        this.selectTexture = this.selectTexture.bind(this);
        this.selectDataFile = this.selectDataFile.bind(this);
        this.updateFrames = this.updateFrames.bind(this);
        this.updateView = this.updateView.bind(this);
        this.changeSplitter = this.changeSplitter.bind(this);       
        this.setBack = this.setBack.bind(this);       
        this.changeScale = this.changeScale.bind(this);
        this.handleWheel = this.handleWheel.bind(this);
    }
    
    componentDidMount() {
        this.updateTexture();
        this.wheelRef.current.addEventListener('wheel', this.handleWheel, { passive: false });
    }

    handleWheel(event) {
        if(!event.ctrlKey) return;

        let value = this.state.scale;
        if (event.deltaY >= 0) {
            if (this.state.scale > 0.1) {
                value = Number((this.state.scale - this.step).toPrecision(2));
                this.setState({scale: value});
                this.updateTextureScale(value);
            }
        } else {
            if (this.state.scale < 2.0) {
                value = Number((this.state.scale + this.step).toPrecision(2));
                this.setState({scale: value});
                this.updateTextureScale(value);
            }
        }

        // update range component
        this.rangeRef.current.value = value;

        event.preventDefault();
        event.stopPropagation();
        return false;
    }

    getFiles(download){
        Observer.emit(GLOBAL_EVENT.SHOW_SHADER);
        if(!this.frames || !this.frames.length) {
            Observer.emit(GLOBAL_EVENT.HIDE_SHADER);
            Observer.emit(GLOBAL_EVENT.SHOW_MESSAGE, I18.f('SPLITTER_ERROR_NO_FRAMES'));
            
            return;
        }
        
        let ctx = this.buffer.getContext('2d');
        let files = [];
        
        let holdTrim = this.holdtrimRef.current.checked;
        
        for(let item of this.frames) {            
            let trimmed = item.trimmed ? holdTrim : false;            
            
            this.buffer.width = (holdTrim && trimmed) ? item.spriteSourceSize.w : item.sourceSize.w;
            this.buffer.height = (holdTrim && trimmed) ? item.spriteSourceSize.h : item.sourceSize.h;
            
            ctx.clearRect(0, 0, this.buffer.width, this.buffer.height);
            
            if(item.rotated) {
                ctx.save();

                ctx.translate(item.spriteSourceSize.x + item.spriteSourceSize.w/2, item.spriteSourceSize.y + item.spriteSourceSize.h/2);
                ctx.rotate(this.state.splitter.inverseRotation ? Math.PI/2 : -Math.PI/2);                

                let dx = trimmed ? item.spriteSourceSize.y - item.spriteSourceSize.h/2 : -item.spriteSourceSize.h/2;
                let dy = trimmed ? -(item.spriteSourceSize.x + item.spriteSourceSize.w/2) : -item.spriteSourceSize.w/2;

                ctx.drawImage(this.texture,
                    item.frame.x, item.frame.y,
                    item.frame.h, item.frame.w,
                    dx, dy,
                    item.spriteSourceSize.h, item.spriteSourceSize.w);
                
                ctx.restore();
            }
            else {
                
                let dx = trimmed ? 0 : item.spriteSourceSize.x;
                let dy = trimmed ? 0 : item.spriteSourceSize.y;
                
                ctx.drawImage(this.texture,
                    item.frame.x, item.frame.y,
                    item.frame.w, item.frame.h,
                    dx, dy,
                    item.spriteSourceSize.w, item.spriteSourceSize.h);
            }

            let ext = item.name.split('.').pop().toLowerCase();
            if(!ext) {
                ext = 'png';
                item.name += '.' + ext;
            }
            
            if (download){
                let base64 = this.buffer.toDataURL(ext === 'png' ? 'image/png' : 'image/jpeg');
                base64 = base64.split(',').pop();

                files.push({
                    name: item.name,
                    content: base64,
                    base64: base64
                });
            }
            else{
                let url = this.buffer.toDataURL(ext === 'png' ? 'image/png' : 'image/jpeg');

                files.push({ name: item.name, url: url, fsPath: null });
            }
        }
        return files;
    }

    repack(){
        const files = this.getFiles(false);
        
        Observer.emit(GLOBAL_EVENT.IMAGES_FROM_REPACK, files);

        Observer.emit(GLOBAL_EVENT.HIDE_SHADER);

        this.close();
    }
    
    doSplit() {
        const files = this.getFiles(true);
        
        Downloader.run(files, this.textureName + '.zip');

        Observer.emit(GLOBAL_EVENT.HIDE_SHADER);
    }

    selectTexture(e) {
        if(e.target.files.length) {
            Observer.emit(GLOBAL_EVENT.SHOW_SHADER);

            let loader = new LocalImagesLoader();
            loader.load(e.target.files, null, data => {
                let keys = Object.keys(data);
                
                this.textureName = keys[0]; 
                
                this.texture = data[this.textureName];
                this.textureNameRef.current.innerHTML = this.textureName;
                
                this.updateView();

                Observer.emit(GLOBAL_EVENT.HIDE_SHADER);
            });
        }
    }
    
    updateTexture() {
        let canvas = this.viewRef.current;
        
        if(this.texture) {
            canvas.width = this.texture.width;
            canvas.height = this.texture.height;
            canvas.style.display = '';
            
            let ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(this.texture, 0, 0);

            canvas.className = this.state.textureBack;
            this.updateTextureScale();
        }
        else {
            canvas.style.display = 'none';
        }
    }

    selectDataFile(e) {
        if(e.target.files.length) {
            let item = e.target.files[0];
            
            let reader = new FileReader();
            reader.onload = e => {
                
                const content = e.target.result.split(',');
                const byteArray = base64js.toByteArray(content[1]);

                console.log(e.target.result);
                
                this.data = new TextDecoder("utf-8").decode(byteArray);;

                this.dataName = item.name;
                this.dataFileNameRef.current.innerHTML = this.dataName;
                
                // fixes a bug where the view doesn't update when you select the texture before the data
                if (this.state.splitter){
                    this.updateView();
                }

                getSplitterByData(this.data, (splitter) => {
                    this.setState({splitter: splitter});
                    this.updateView();
                });
            };

            reader.readAsDataURL(item);
        }
    }
    
    updateFrames() {
        if(!this.texture) return;
        
        this.state.splitter.split(this.data, {
            textureWidth: this.texture.width,
            textureHeight: this.texture.height,
            width: this.widthRef.current.value * 1 || 32,
            height: this.heightRef.current.value * 1 || 32,
            padding: this.paddingRef.current.value * 1 || 0
        }, frames => {
            if(frames) {
                this.frames = frames;

                let canvas = this.viewRef.current;
                let ctx = canvas.getContext('2d');

                for(let item of this.frames) {
                    let frame = item.frame;

                    let w = frame.w, h = frame.h;
                    if(item.rotated) {
                        w = frame.h;
                        h = frame.w;
                    }

                    ctx.strokeStyle = "#00F";
                    ctx.fillStyle = "rgba(0,0,255,0.25)";
                    ctx.lineWidth = 1;

                    ctx.beginPath();
                    ctx.fillRect(frame.x, frame.y, w, h);
                    ctx.rect(frame.x, frame.y, w, h);
                    ctx.moveTo(frame.x, frame.y);
                    ctx.lineTo(frame.x + w, frame.y + h);
                    ctx.stroke();

                }

            }
        });
    }
    
    updateView() {
        console.log("updateView");
        this.updateTexture();
        this.updateFrames();
    }

    changeSplitter(e) {
        let splitter = getSplitterByType(e.target.value);
        
        this.state.splitter = splitter;
        
        this.setState({splitter: splitter});
        this.updateView();
    }

    setBack(e) {
        let classNames = e.target.className.split(" ");
        for(let name of classNames) {
            if(this.textureBackColors.indexOf(name) >= 0) {
                this.setState({textureBack: name});

                let canvas = this.viewRef.current;
                canvas.className = name;

                return;
            }
        }
    }

    updateTextureScale(val=this.state.scale) {
        if(this.texture) {
            let w = Math.floor(this.texture.width * val);
            let h = Math.floor(this.texture.height * val);

            let canvas = this.viewRef.current;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
        }
    }

    changeScale(e) {
        let val = Number(e.target.value);
        this.setState({scale: val});
        this.updateTextureScale(val);        
    }

    close() {
        Observer.emit(GLOBAL_EVENT.HIDE_SHEET_SPLITTER);
    }

    render() {        
        let displayType = this.state.splitter.type;
        
        let displayGridProperties = 'none';
        
        switch (displayType) {
            case "Grid": {
                displayGridProperties = '';
                break;
            }
        }

        return (
            <div className="sheet-splitter-shader">
                <div className="sheet-splitter-content">
                    <div className="sheet-splitter-top">
                        <table>
                            <tbody>
                                <tr>
                                    <td>
                                        <div className="btn back-800 border-color-gray color-white file-upload">
                                            {I18.f("SELECT_TEXTURE")}
                                            <input type="file" ref={this.selectTextureInputRef} accept="image/png,image/jpg,image/jpeg,image/gif" onChange={this.selectTexture} />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="back-400 border-color-gray color-black sheet-splitter-info-text" ref={this.textureNameRef}>&nbsp;</div>
                                    </td>
                                    <td>
                                        <div className="btn back-800 border-color-gray color-white file-upload">
                                            {I18.f("SELECT_DATA_FILE")}
                                            <input type="file" ref={this.selectTextureInputRef} onChange={this.selectDataFile} />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="back-400 border-color-gray color-black sheet-splitter-info-text" ref={this.dataFileNameRef}>&nbsp;</div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div ref={this.wheelRef} className="sheet-splitter-view">
                        <canvas ref={this.viewRef}/>
                    </div>

                    <div className="sheet-splitter-controls">
                        <table>
                            <tbody>
                                <tr>
                                    <td>{I18.f('FORMAT')}</td>
                                    <td>
                                        <select ref={this.dataFormatRef} className="border-color-gray" value={this.state.splitter.type} onChange={this.changeSplitter}>
                                            {splitters.map(node => {
                                                return (<option key={"data-format-" + node.type} defaultValue={node.type}>{node.type}</option>)
                                            })}
                                        </select>
                                    </td>
                                </tr>
                                <tr>
                                    <td>{I18.f('HOLD_TRIM')}</td>
                                    <td>
                                        <input ref={this.holdtrimRef} type="checkbox" className="border-color-gray"/>
                                    </td>
                                </tr>
                                <tr style={{display: displayGridProperties}}>
                                    <td>{I18.f('WIDTH')}</td>
                                    <td>
                                        <input type="number" ref={this.widthRef} defaultValue='64' onChange={this.updateView}/>
                                    </td>
                                </tr>
                                <tr style={{display: displayGridProperties}}>
                                    <td>{I18.f('HEIGHT')}</td>
                                    <td>
                                        <input type="number" ref={this.heightRef} defaultValue='64' onChange={this.updateView}/>
                                    </td>
                                </tr>
                                <tr style={{display: displayGridProperties}}>
                                    <td>{I18.f('PADDING')}</td>
                                    <td>
                                        <input type="number" ref={this.paddingRef} defaultValue='0' onChange={this.updateView}/>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="sheet-splitter-bottom">
                        <table>
                            <tbody>
                                <tr>
                                    {this.textureBackColors.map(name => {
                                        return (
                                            <td key={"back-color-btn-" + name}>
                                                <div className={"btn-back-color " + name + (this.state.textureBack === name ? " selected" : "")} onClick={this.setBack}>&nbsp;</div>
                                            </td>
                                        )
                                    })}

                                    <td>
                                        {I18.f("SCALE")}
                                    </td>
                                    <td>
                                        <input ref={this.rangeRef} type="range" min="0.1" max="2" step={this.step} defaultValue="1" onChange={this.changeScale}/>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <div>
                            <div className="btn back-800 border-color-gray color-white" onClick={this.repack}>{I18.f("REPACK")}</div>
                            <div className="btn back-800 border-color-gray color-white" onClick={this.doSplit}>{I18.f("SPLIT")}</div>
                            <div className="btn back-800 border-color-gray color-white" onClick={this.close}>{I18.f("CLOSE")}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default SheetSplitter;
