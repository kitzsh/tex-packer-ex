import React from 'react';
import ReactDOM from 'react-dom';

import Storage from '../utils/Storage';

import exporters from '../exporters';
import { getExporterByType } from '../exporters';
import packers from '../packers';
import { getPackerByType } from '../packers';
import filters from '../filters';
import { getFilterByType } from '../filters';

import I18 from '../utils/I18';

import {Observer, GLOBAL_EVENT} from '../Observer';

import FileSystem from 'platform/FileSystem';

const STORAGE_OPTIONS_KEY = "pack-options";
const STORAGE_CUSTOM_EXPORTER_KEY = "custom-exporter";

let INSTANCE = null;

class PackProperties extends React.Component {
    constructor(props) {
        super(props);

        INSTANCE = this;

        this.textureNameRef = React.createRef();
        this.textureFormatRef = React.createRef();
        this.removeFileExtensionRef = React.createRef();
        this.prependFolderNameRef = React.createRef();
        this.base64ExportRef = React.createRef();
        this.tinifyRef = React.createRef();
        this.tinifyKeyRef = React.createRef();
        this.scaleRef = React.createRef();
        this.filterRef = React.createRef();
        this.exporterRef = React.createRef();
        this.editCustomFormatRef = React.createRef();
        this.fileNameRef = React.createRef();
        this.savePathRef = React.createRef();
        this.widthRef = React.createRef();
        this.heightRef = React.createRef();
        this.fixedSizeRef = React.createRef();
        this.powerOfTwoRef = React.createRef();
        this.paddingRef = React.createRef();
        this.extrudeRef = React.createRef();
        this.allowRotationRef = React.createRef();
        this.allowTrimRef = React.createRef();
        this.trimModeRef = React.createRef();
        this.alphaThresholdRef = React.createRef();
        this.detectIdenticalRef = React.createRef();
        this.packerRef = React.createRef();
        this.packerMethodRef = React.createRef();

        this.onPackerChange = this.onPackerChange.bind(this);
        this.onPropChanged = this.onPropChanged.bind(this);
        this.onExporterChanged = this.onExporterChanged.bind(this);
        this.onExporterPropChanged = this.onExporterPropChanged.bind(this);
        this.forceUpdate = this.forceUpdate.bind(this);
        this.selectSavePath = this.selectSavePath.bind(this);
        
        this.packOptions = this.loadOptions();
        this.loadCustomExporter();
        
        this.state = {packer: this.packOptions.packer};
    }
    
    static get i() {
        return INSTANCE;
    }
    
    setOptions(data) {
        this.packOptions = this.applyOptionsDefaults(data);
        this.saveOptions();
        this.refreshPackOptions();
        this.emitChanges();
    }
    
    loadCustomExporter() {
        let data = Storage.load(STORAGE_CUSTOM_EXPORTER_KEY);
        if(data) {
            let exporter = getExporterByType("custom");
            exporter.allowTrim = data.allowTrim;
            exporter.allowRotation = data.allowRotation;
            exporter.fileExt = data.fileExt;
            exporter.content = data.content;
        }
    }
    
    loadOptions() {
        return this.applyOptionsDefaults(Storage.load(STORAGE_OPTIONS_KEY));
    }
    
    applyOptionsDefaults(data) {
        if(!data) data = {};
        
        data.textureName = data.textureName || "texture";
        data.textureFormat = data.textureFormat || "png";
        data.removeFileExtension = data.removeFileExtension === undefined ? false : data.removeFileExtension;
        data.prependFolderName = data.prependFolderName === undefined ? true : data.prependFolderName;
        data.scale = data.scale || 1;
        data.filter = getFilterByType(data.filter) ? data.filter : filters[0].type;
        data.exporter = getExporterByType(data.exporter) ? data.exporter : exporters[0].type;
        data.base64Export = data.base64Export === undefined ? false : data.base64Export;
        data.tinify = data.tinify === undefined ? false : data.tinify;
        data.tinifyKey = data.tinifyKey === undefined ? "" : data.tinifyKey;
        data.fileName = data.fileName || "pack-result";
        data.savePath = data.savePath || "";
        data.width = data.width === undefined ? 8192 : data.width;
        data.height = data.height === undefined ? 8192 : data.height;
        data.fixedSize = data.fixedSize === undefined ? false : data.fixedSize;
        data.powerOfTwo = data.powerOfTwo === undefined ? false : data.powerOfTwo;
        data.padding = data.padding === undefined ? 0 : data.padding;
        data.extrude = data.extrude === undefined ? 0 : data.extrude;
        data.allowRotation = data.allowRotation === undefined ? true : data.allowRotation;
        data.allowTrim = data.allowTrim === undefined ? true : data.allowTrim;
        data.trimMode = data.trimMode === undefined ? "trim" : data.trimMode;
        data.alphaThreshold = data.alphaThreshold || 0;
        data.detectIdentical = data.detectIdentical === undefined ? true : data.detectIdentical;
        data.packer = getPackerByType(data.packer) ? data.packer : packers[0].type;
        
        let methodValid = false;
        let packer = getPackerByType(data.packer);
        let packerMethods = Object.keys(packer.methods);
        for(let method of packerMethods) {
            if(method == data.packerMethod) {
                methodValid = true;
                break;
            }
        }
        
        if(!methodValid) data.packerMethod = packerMethods[0];
        
        return data;
    }
    
    saveOptions(force=false) {
        if(PLATFORM === "web" || force) {
            Storage.save(STORAGE_OPTIONS_KEY, this.packOptions);
        }
    }

    componentDidMount() {
        this.updateEditCustomTemplateButton();
        this.emitChanges();
    }
    
    updatePackOptions() {
        let data = {};
        
        data.textureName = this.textureNameRef.current.value;
        data.textureFormat = this.textureFormatRef.current.value;
        data.removeFileExtension = this.removeFileExtensionRef.current.checked;
        data.prependFolderName = this.prependFolderNameRef.current.checked;
        data.base64Export = this.base64ExportRef.current.checked;
        data.tinify = this.tinifyRef.current.checked;
        data.tinifyKey = this.tinifyKeyRef.current.value;
        data.scale = Number(this.scaleRef.current.value);
        data.filter = this.filterRef.current.value;
        data.exporter = this.exporterRef.current.value;
        data.fileName = this.fileNameRef.current.value;
        data.savePath = this.savePathRef.current.value;
        data.width = Number(this.widthRef.current.value) || 0;
        data.height = Number(this.heightRef.current.value) || 0;
        data.fixedSize = this.fixedSizeRef.current.checked;
        data.powerOfTwo = this.powerOfTwoRef.current.checked;
        data.padding = Number(this.paddingRef.current.value) || 0;
        data.extrude = Number(this.extrudeRef.current.value) || 0;
        data.allowRotation = this.allowRotationRef.current.checked;
        data.allowTrim = this.allowTrimRef.current.checked;
        data.trimMode = this.trimModeRef.current.value;
        data.alphaThreshold = this.alphaThresholdRef.current.value;
        data.detectIdentical = this.detectIdenticalRef.current.checked;
        data.packer = this.packerRef.current.value;
        data.packerMethod = this.packerMethodRef.current.value;

        this.packOptions = this.applyOptionsDefaults(data);
    }
    
    refreshPackOptions() {
        this.textureNameRef.current.value = this.packOptions.textureName;
        this.textureFormatRef.current.value = this.packOptions.textureFormat;
        this.removeFileExtensionRef.current.checked = this.packOptions.removeFileExtension;
        this.prependFolderNameRef.current.checked = this.packOptions.prependFolderName;
        this.base64ExportRef.current.checked = this.packOptions.base64Export;
        this.tinifyRef.current.checked = this.packOptions.tinify;
        this.tinifyKeyRef.current.value = this.packOptions.tinifyKey;
        this.scaleRef.current.value = Number(this.packOptions.scale);
        this.filterRef.current.value = this.packOptions.filter;
        this.exporterRef.current.value = this.packOptions.exporter;
        this.fileNameRef.current.value = this.packOptions.fileName;
        this.savePathRef.current.value = this.packOptions.savePath;
        this.widthRef.current.value = Number(this.packOptions.width) || 0;
        this.heightRef.current.value = Number(this.packOptions.height) || 0;
        this.fixedSizeRef.current.checked = this.packOptions.fixedSize;
        this.powerOfTwoRef.current.checked = this.packOptions.powerOfTwo;
        this.paddingRef.current.value = Number(this.packOptions.padding) || 0;
        this.extrudeRef.current.value = Number(this.packOptions.extrude) || 0;
        this.allowRotationRef.current.checked = this.packOptions.allowRotation;
        this.allowTrimRef.current.checked = this.packOptions.allowTrim;
        this.trimModeRef.current.value = this.packOptions.trimMode;
        this.alphaThresholdRef.current.value = this.packOptions.alphaThreshold || 0;
        this.detectIdenticalRef.current.checked = this.packOptions.detectIdentical;
        this.packerRef.current.value = this.packOptions.packer;
        this.packerMethodRef.current.value = this.packOptions.packerMethod;
    }

    getPackOptions() {
        let data = Object.assign({}, this.packOptions);
        data.exporter = getExporterByType(data.exporter);
        data.packer = getPackerByType(data.packer);
        return data;
    }

    emitChanges() {
        Observer.emit(GLOBAL_EVENT.PACK_OPTIONS_CHANGED, this.getPackOptions());
    }

    onPackerChange(e) {
        this.setState({packer: e.target.value});
        this.onPropChanged();
    }
    
    onPropChanged() {
        this.updatePackOptions();
        this.saveOptions();
        
        this.emitChanges();
    }

    onExporterChanged() {
        let exporter = getExporterByType(this.exporterRef.current.value);
        let allowTrimInput = this.allowTrimRef.current;
        let allowRotationInput = this.allowRotationRef.current;
        
        let doRefresh = (allowTrimInput.checked !== exporter.allowTrim) || 
                        (allowRotationInput.checked !== exporter.allowRotation);
        
        allowTrimInput.checked = exporter.allowTrim;
        allowRotationInput.checked = exporter.allowRotation;
        
        this.updateEditCustomTemplateButton();
        
        this.onExporterPropChanged();
        if(doRefresh) this.onPropChanged();
    }
    
    updateEditCustomTemplateButton() {
        let exporter = getExporterByType(this.exporterRef.current.value);
        this.editCustomFormatRef.current.style.visibility = exporter.type === "custom" ? "visible" : "hidden";
    }
    
    onExporterPropChanged() {
        this.updatePackOptions();
        this.saveOptions();
        
        Observer.emit(GLOBAL_EVENT.PACK_EXPORTER_CHANGED, this.getPackOptions());
    }

    forceUpdate(e) {
        if(e) {
            let key = e.keyCode || e.which;
            if (key === 13) this.onPropChanged();
        }
    }
    
    startExport() {
        Observer.emit(GLOBAL_EVENT.START_EXPORT);
    }

    editCustomExporter() {
        Observer.emit(GLOBAL_EVENT.SHOW_EDIT_CUSTOM_EXPORTER);
    }

    selectSavePath() {
        let dir = FileSystem.selectFolder();
        if(dir) {
            this.savePathRef.current.value = dir;
            this.onExporterPropChanged();
        }
    }
    
    render() {

        let exporter = getExporterByType(this.packOptions.exporter);
        let allowRotation = this.packOptions.allowRotation && exporter.allowRotation;
        let exporterRotationDisabled = exporter.allowRotation ? "" : "disabled";
        let allowTrim = this.packOptions.allowTrim && exporter.allowTrim;
        let exporterTrimDisabled = exporter.allowTrim ? "" : "disabled";

        return (
            <div className="props-list back-white">
                <div className="pack-properties-containter">
                    <table>
                        <tbody>
                            <tr title={I18.f("TEXTURE_NAME_TITLE")}>
                                <td>{I18.f("TEXTURE_NAME")}</td>
                                <td><input ref={this.textureNameRef} type="text" className="border-color-gray" defaultValue={this.packOptions.textureName} onBlur={this.onExporterPropChanged} /></td>
                                <td></td>
                            </tr>
                            <tr title={I18.f("TEXTURE_FORMAT_TITLE")}>
                                <td>{I18.f("TEXTURE_FORMAT")}</td>
                                <td>
                                    <select ref={this.textureFormatRef} className="border-color-gray" defaultValue={this.packOptions.textureFormat} onChange={this.onExporterChanged}>
                                        <option value="png">png</option>
                                        <option value="jpg">jpg</option>
                                    </select>
                                </td>
                                <td></td>
                            </tr>
                            <tr title={I18.f("REMOVE_FILE_EXT_TITLE")}>
                                <td>{I18.f("REMOVE_FILE_EXT")}</td>
                                <td><input ref={this.removeFileExtensionRef} className="border-color-gray" type="checkbox" defaultChecked={this.packOptions.removeFileExtension ? "checked" : ""} onChange={this.onExporterPropChanged} /></td>
                                <td></td>
                            </tr>
                            <tr title={I18.f("PREPEND_FOLDER_TITLE")}>
                                <td>{I18.f("PREPEND_FOLDER")}</td>
                                <td><input ref={this.prependFolderNameRef} className="border-color-gray" type="checkbox" defaultChecked={this.packOptions.prependFolderName ? "checked" : ""} onChange={this.onExporterPropChanged} /></td>
                                <td></td>
                            </tr>
                            <tr title={I18.f("BASE64_EXPORT_TITLE")}>
                                <td>{I18.f("BASE64_EXPORT")}</td>
                                <td><input ref={this.base64ExportRef} className="border-color-gray" type="checkbox" defaultChecked={this.packOptions.base64Export ? "checked" : ""} onChange={this.onExporterPropChanged} /></td>
                                <td></td>
                            </tr>
                            <tr title={I18.f("TINIFY_TITLE")}>
                                <td>{I18.f("TINIFY")}</td>
                                <td><input ref={this.tinifyRef} className="border-color-gray" type="checkbox" defaultChecked={this.packOptions.tinify ? "checked" : ""} onChange={this.onExporterPropChanged} /></td>
                                <td></td>
                            </tr>
                            <tr title={I18.f("TINIFY_KEY_TITLE")}>
                                <td>{I18.f("TINIFY_KEY")}</td>
                                <td><input ref={this.tinifyKeyRef} type="text" className="border-color-gray" defaultValue={this.packOptions.tinifyKey} onBlur={this.onExporterPropChanged} /></td>
                                <td></td>
                            </tr>
                            <tr title={I18.f("SCALE_TITLE")}>
                                <td>{I18.f("SCALE")}</td>
                                <td><input ref={this.scaleRef} type="number" min="0" className="border-color-gray" defaultValue={this.packOptions.scale} onBlur={this.onPropChanged}/></td>
                                <td></td>
                            </tr>
                            <tr title={I18.f("FILTER_TITLE")}>
                                <td>{I18.f("FILTER")}</td>
                                <td>
                                    <select ref={this.filterRef} className="border-color-gray" onChange={this.onExporterChanged} defaultValue={this.packOptions.filter}>
                                        {filters.map(node => {
                                            return (<option key={"filter-" + node.type} defaultValue={node.type}>{node.type}</option>)
                                        })}
                                    </select>
                                </td>
                                <td></td>
                            </tr>
                            <tr title={I18.f("FORMAT_TITLE")}>
                                <td>{I18.f("FORMAT")}</td>
                                <td>
                                    <select ref={this.exporterRef} className="border-color-gray" onChange={this.onExporterChanged} defaultValue={this.packOptions.exporter}>
                                    {exporters.map(node => {
                                        return (<option key={"exporter-" + node.type} defaultValue={node.type}>{node.type}</option>)
                                    })}
                                    </select>
                                </td>
                                <td>
                                    <div className="edit-btn back-800" ref={this.editCustomFormatRef} onClick={this.editCustomExporter}></div>
                                </td>
                            </tr>
                            <tr title={I18.f("FILE_NAME_TITLE")} style={{display: PLATFORM === 'web' ? '' : 'none'}}>
                                <td>{I18.f("FILE_NAME")}</td>
                                <td><input ref={this.fileNameRef} className="border-color-gray" type="text" defaultValue={this.packOptions.fileName} onBlur={this.onExporterPropChanged} /></td>
                                <td></td>
                            </tr>
                            <tr title={I18.f("SAVE_PATH_TITLE")} style={{display: PLATFORM === 'electron' ? '' : 'none'}}>
                                <td>{I18.f("SAVE_PATH")}</td>
                                <td><input ref={this.savePathRef} className="border-color-gray" type="text" defaultValue={this.packOptions.savePath} onBlur={this.onExporterPropChanged} /></td>
                                <td>
                                    <div className="folder-btn back-800" onClick={this.selectSavePath}></div>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="3" className="center-align">
                                    <div className="btn back-800 border-color-gray color-white" onClick={this.startExport}>{I18.f("EXPORT")}</div>
                                </td>
                            </tr>
                            
                            <tr title={I18.f("WIDTH_TITLE")}>
                                <td>{I18.f("WIDTH")}</td>
                                <td><input ref={this.widthRef} type="number" min="0" className="border-color-gray" defaultValue={this.packOptions.width} onBlur={this.onPropChanged} onKeyDown={this.forceUpdate}/></td>
                                <td></td>
                            </tr>
                            <tr title={I18.f("HEIGHT_TITLE")}>
                                <td>{I18.f("HEIGHT")}</td>
                                <td><input ref={this.heightRef} type="number" min="0" className="border-color-gray" defaultValue={this.packOptions.height} onBlur={this.onPropChanged} onKeyDown={this.forceUpdate}/></td>
                                <td></td>
                            </tr>
                            <tr title={I18.f("FIXED_SIZE_TITLE")}>
                                <td>{I18.f("FIXED_SIZE")}</td>
                                <td><input ref={this.fixedSizeRef} type="checkbox" className="border-color-gray" onChange={this.onPropChanged} defaultChecked={this.packOptions.fixedSize ? "checked" : ""} /></td>
                                <td></td>
                            </tr>
                            <tr title={I18.f("POWER_OF_TWO_TITLE")}>
                                <td>{I18.f("POWER_OF_TWO")}</td>
                                <td><input ref={this.powerOfTwoRef} type="checkbox" className="border-color-gray" onChange={this.onPropChanged} defaultChecked={this.packOptions.powerOfTwo ? "checked" : ""} /></td>
                                <td></td>
                            </tr>
                            <tr title={I18.f("PADDING_TITLE")}>
                                <td>{I18.f("PADDING")}</td>
                                <td><input ref={this.paddingRef} type="number" className="border-color-gray" defaultValue={this.packOptions.padding} min="0" onInput={this.onPropChanged} onKeyDown={this.forceUpdate}/></td>
                                <td></td>
                            </tr>
                            <tr title={I18.f("EXTRUDE_TITLE")}>
                                <td>{I18.f("EXTRUDE")}</td>
                                <td><input ref={this.extrudeRef} type="number" className="border-color-gray" defaultValue={this.packOptions.extrude} min="0" onInput={this.onPropChanged} onKeyDown={this.forceUpdate}/></td>
                                <td></td>
                            </tr>
                            <tr title={I18.f("ALLOW_ROTATION_TITLE")}>
                                <td>{I18.f("ALLOW_ROTATION")}</td>
                                <td><input ref={this.allowRotationRef} type="checkbox" className="border-color-gray" onChange={this.onPropChanged} defaultChecked={allowRotation ? "checked" : ""} disabled={exporterRotationDisabled} /></td>
                                <td></td>
                            </tr>
                            <tr title={I18.f("ALLOW_TRIM_TITLE")}>
                                <td>{I18.f("ALLOW_TRIM")}</td>
                                <td><input ref={this.allowTrimRef} type="checkbox" className="border-color-gray" onChange={this.onPropChanged} defaultChecked={allowTrim ? "checked" : ""}  disabled={exporterTrimDisabled} /></td>
                                <td></td>
                            </tr>
                            <tr title={I18.f("TRIM_MODE_TITLE")}>
                                <td>{I18.f("TRIM_MODE")}</td>
                                <td>
                                    <select ref={this.trimModeRef} className="border-color-gray" onChange={this.onPropChanged} defaultValue={this.packOptions.trimMode}  disabled={exporterTrimDisabled || !this.packOptions.allowTrim}>
                                        <option value="trim">trim</option>
                                        <option value="crop">crop</option>
                                    </select>
                                </td>
                                <td></td>
                            </tr>
                            <tr title={I18.f("ALPHA_THRESHOLD_TITLE")}>
                                <td>{I18.f("ALPHA_THRESHOLD")}</td>
                                <td><input ref={this.alphaThresholdRef} type="number" className="border-color-gray" defaultValue={this.packOptions.alphaThreshold} min="0" max="255" onBlur={this.onPropChanged} onKeyDown={this.forceUpdate}/></td>
                                <td></td>
                            </tr>
                            <tr title={I18.f("DETECT_IDENTICAL_TITLE")}>
                                <td>{I18.f("DETECT_IDENTICAL")}</td>
                                <td><input ref={this.detectIdenticalRef} type="checkbox" className="border-color-gray" onChange={this.onPropChanged} defaultChecked={this.packOptions.detectIdentical ? "checked" : ""}/></td>
                                <td></td>
                            </tr>
                            <tr title={I18.f("PACKER_TITLE")}>
                                <td>{I18.f("PACKER")}</td>
                                <td>
                                    <select ref={this.packerRef} className="border-color-gray" onChange={this.onPackerChange} defaultValue={this.packOptions.packer}>
                                    {packers.map(node => {
                                        return (<option key={"packer-" + node.type} defaultValue={node.type}>{node.type}</option>)
                                    })}
                                    </select>
                                </td>
                                <td></td>
                            </tr>
                            <tr title={I18.f("PACKER_METHOD_TITLE")}>
                                <td>{I18.f("PACKER_METHOD")}</td>
                                <td><PackerMethods ref={this.packerMethodRef} packer={this.state.packer} defaultMethod={this.packOptions.packerMethod} handler={this.onPropChanged}/></td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

class PackerMethods extends React.Component {
    render() {
        let packer = getPackerByType(this.props.packer);

        if(!packer) {
            throw new Error("Unknown packer " + this.props.packer);
        }

        let items = [];
        
        let methods = Object.keys(packer.methods);
        for(let item of methods) {
            items.push(<option value={item} key={"packer-method-" + item }>{item}</option>);
        }

        return (
            <select onChange={this.props.handler} className="border-color-gray" defaultValue={this.props.defaultMethod} >{items}</select>
        )
    }
}

export default PackProperties;
