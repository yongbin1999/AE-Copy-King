// 获取脚本文件所在文件夹路径
var scriptFolder = $.fileName.split("/").slice(0, -1).join("/") + "/";
// 创建用于保存JSON文件的文件夹对象
var jsonFolder = new Folder(scriptFolder + "Copy_King_YB" + "/" + "Copy_King_JSON");
if (!jsonFolder.exists) {
  jsonFolder.create();
}

// 获取脚本面板对象或创建一个新窗口面板对象
var panelGlobal = this;
var win = (panelGlobal instanceof Panel) ? panelGlobal : new Window("palette");
if (!(panelGlobal instanceof Panel)) win.text = "复制大王_YB_1.2";
win.orientation = "column";
win.alignChildren = ["fill", "top"];
win.spacing = 10;
win.margins = 16;

// 添加搜索框
var searchPanel = win.add("panel", undefined, "搜索");
searchPanel.alignment = ["fill", "top"];
searchPanel.alignChildren = ["fill", "center"];
var searchInput = searchPanel.add("edittext", undefined, "");
searchInput.active = true;
searchInput.alignment = ["fill", "center"];

// 添加文件夹和设置按钮
var folderBtn, settingsBtn, aboutBtn;
var topGroup = win.add("group");
topGroup.alignment = ["fill", "top"];
topGroup.alignChildren = ["left", "top"];

folderBtn = topGroup.add("button", undefined, "文件夹");
folderBtn.size = [50, 20];
folderBtn.alignment = ["left", "center"];
settingsBtn = topGroup.add("button", undefined, "设置");
settingsBtn.size = [50, 20];
settingsBtn.alignment = ["left", "center"];
aboutBtn = topGroup.add("button", undefined, "关于");
aboutBtn.size = [50, 20];
aboutBtn.alignment = ["left", "center"];

// 添加文件列表
var fileList = win.add("listbox", [0, 0, 200, 300], []);
fileList.itemSize = ["fill", 35];
fileList.alignment = ["fill", "fill"];
fileList.alignChildren = ["fill", "center"];
fileList.autoSize = true;

// 添加操作按钮
var buttonGroup = win.add("group");
buttonGroup.alignment = ["fill", "bottom"];
buttonGroup.alignChildren = ["fill", "center"];
var refreshBtn = buttonGroup.add("button", undefined, "刷新列表");
var readBtn = buttonGroup.add("button", undefined, "读取配置");
var saveBtn = buttonGroup.add("button", undefined, "保存配置");
var deleteBtn = buttonGroup.add("button", undefined, "删除配置");
var renameBtn = buttonGroup.add("button", undefined, "重命名配置");

readBtn.onClick = loadJSON;
saveBtn.onClick = saveJSON;
fileList.onDoubleClick = loadJSON;

updateFileList("");

// 刷新按钮
refreshBtn.onClick = function () {
  updateFileList(searchInput.text);
  fileList.selection = 0;
  fileList.selection = null;

  app.cancelTask(); // 取消当前任务
  var scriptFile = new File($.fileName);
  $.evalFile(scriptFile); // 重新加载当前脚本文件

}

// 监听搜索框输入
searchInput.onChanging = function () {
  updateFileList(searchInput.text);
}

// 刷新列表
function updateFileList(searchText) {
  var selectedIdx = fileList.selection !== null ? fileList.selection.index : -1;
  fileList.removeAll();
  var files = jsonFolder.getFiles("*.json");
  for (var i = 0; i < files.length; i++) {
    var fileName = decodeURI(files[i].name);
    if (fileName.indexOf(searchText) !== -1) {
      var displayName = fileName.replace(".json", "");
      fileList.add("item", displayName, fileName);
    }
  }

  // 选中下一个列表项
  if (selectedIdx >= 0 && fileList.items.length > 0) {
    var nextIdx = -1;
    for (var i = 0; i < fileList.items.length; i++) {
      if (fileList.items[i].index === selectedIdx) {
        nextIdx = (i + 1) % fileList.items.length;
        break;
      }
    }
    if (nextIdx >= 0) {
      fileList.selection = fileList.items[nextIdx];
    } else {
      fileList.selection = 0;
    }
  }

  $.gc();

}

// 文件夹按钮
folderBtn.onClick = function () {
  // 如果脚本列表为空，打开jsonFolder文件夹
  if (fileList.items.length == 0) {
    jsonFolder.execute();
    return;
  }
  // 检查是否选中的列表行
  if (fileList.selection == null) {
    // 检查是否选中了一个合法的图层
    var activeComp = app.project.activeItem;
    if (activeComp != null && activeComp instanceof CompItem) {
      var selectedLayers = activeComp.selectedLayers;
      if (selectedLayers.length > 0) {
        var selectedLayer = selectedLayers[0];
        // 检查图层是否有源素材
        if (selectedLayer.source != null && selectedLayer.source.file != null) {
          var sourceFile = selectedLayer.source.file;
          // 检查是否为素材文件
          if (sourceFile instanceof File && sourceFile.exists) {
            sourceFile.parent.execute();
            return;
          }
        }
      }
    }
    // 检查是否选中了项目中的素材文件
    var selectedItems = app.project.selection;
    if (selectedItems.length > 0) {
      var selectedItem = selectedItems[0];
      if (selectedItem instanceof FootageItem && selectedItem.file instanceof File && selectedItem.file.exists) {
        selectedItem.file.parent.execute();
        return;
      }
    }
    // 检查当前项目文件是否保存
    if (app.project.file == null) {
      jsonFolder.execute();
    } else {
      var projectFolder = new Folder(app.project.file.parent.fsName);
      projectFolder.execute();
    }
  } else {
    jsonFolder.execute();
  }
};

// 设置按钮
settingsBtn.onClick = function () {
  // 创建设置窗口
  var settingsWin = new Window("dialog", "脚本设置(预计下个版本更新)");
  settingsWin.bounds = [100, 100, 800, 500]; // 设置窗口的大小和位置

  // 显示设置窗口
  settingsWin.show();

};

//删除JSON
deleteBtn.onClick = function () {
  var selectedFile = fileList.selection;
  if (!selectedFile) {
    alert("请选择文件！");
    return;
  }

  // 获取当前选中的列表项索引
  var currentIndex = fileList.selection.index;

  var jsonFile = new File(decodeURI(jsonFolder.fsName) + "/" + encodeURI(selectedFile.text + ".json"));
  var confirmResult = confirm("是否确定删除文件 " + decodeURI(jsonFile.name) + " ?");
  if (confirmResult) {
    jsonFile.close(); // 关闭文件对象
    jsonFile.remove(); // 删除文件


    // 更新文件列表
    updateFileList(searchInput.text);

    // 选中下一个列表项
    if (fileList.items.length > 0) {
      var nextIndex = currentIndex % fileList.items.length;
      fileList.selection = nextIndex;
    }
  }
}

//重命名JSON
renameBtn.onClick = function () {
  var selectedFile = fileList.selection;
  if (!selectedFile) {
    alert("请选择文件！");
    return;
  }
  var jsonFile = new File(decodeURI(jsonFolder.fsName) + "/" + encodeURI(selectedFile.text + ".json"));
  jsonFile.close(); // 关闭文件对象
  var oldName = selectedFile.text + ".json".split(".")[0]; // 获取原始文件名，去掉".json"后缀
  var newName = prompt("请输入新的文件名：", oldName);
  if (!newName) {
    return;
  }

  // 添加".json"后缀
  newName += ".json";
  var nameExists = true;
  var suffix = 0;

  // 判断新名称是否已经存在，如果存在，则在名称后面添加数字后缀
  while (nameExists) {
    var nameTest = suffix === 0 ? newName : newName.replace(".json", "") + suffix + ".json";
    var testFile = new File(decodeURI(jsonFolder.fsName) + "/" + encodeURI(nameTest));
    if (!testFile.exists) {
      nameExists = false;
      newName = nameTest;
    } else {
      suffix++;
    }
  }

  jsonFile.rename(decodeURI(newName)); // 重命名文件
  updateFileList(searchInput.text); // 更新文件列表
}

//读取JSON
function loadJSON() {
  app.beginUndoGroup("读取JSON");

  // 获取选中的图层
  var selectedLayers = app.project.activeItem.selectedLayers;
  if (selectedLayers.length === 0) {
    alert("请选择至少一个图层。");
    return;
  }


  var selectedFile = fileList.selection;
  if (!selectedFile) {
    alert("请选择列！");
    return;
  }

  // 读取JSON文件中的图层信息
  var loadFile = new File(jsonFolder.fsName + "/" + encodeURI(selectedFile.text + ".json"));
  if (loadFile != null) {
    loadFile.encoding = "UTF8";
    loadFile.open("r");
    var jsonData = loadFile.read();
    var layers = JSON.parse(jsonData);
    loadFile.close();

    // 应用图层信息和特效参数
    for (var i = 0; i < selectedLayers.length; i++) {
      var layer = selectedLayers[i];
      var layerData = layers[i];
      layer.name = layerData.layerName;
      layer.blendingMode = layerData.blendingMode;
      layer.trackMatteType = layerData.trackMatteType;
      layer.transform.opacity.setValue(layerData.opacity);
      layer.enabled = !layerData.isHidden;
      layer.transform.scale.setValue([layerData.scale[0], layerData.scale[1]]);
      if (layerData.hasMask && layer.mask instanceof MaskPropertyGroup) {
        //layer.mask.maskPath.setValue(layerData.maskPath);
        // 可以在这里设置mask的其他属性
      }
      for (var j = 0; j < layerData.effects.length; j++) {
        var effectData = layerData.effects[j];
        var effects = effectData.effects;
        var effectName = effectData.effectName;
        var effectEnabled = effectData.effectEnabled;
        var effect = layer.property("ADBE Effect Parade").property(effectName);
        if (!effect) {
          effect = layer.property("ADBE Effect Parade").addProperty(effects);
          effect.name = effectName;
        }
        effect.enabled = effectEnabled;
        setEffectParameters(effect, effectData.effectParameters);
      }

      // 移动图层到指定的位置
      try {
        layer.moveTo(layerData.layerIndex);
      } catch (e) {
        // 忽略可能出现的错误
      }
    }

    alert("已应用图层数据到所选合成中。");
  }

  app.endUndoGroup();

  app.cancelTask(); // 取消当前任务
  var scriptFile = new File($.fileName);
  $.evalFile(scriptFile); // 重新加载当前脚本文件

}

//保存JSON
function saveJSON() {
  app.beginUndoGroup("保存JSON");
  // 获取选中的图层
  var selectedLayers = app.project.activeItem.selectedLayers;
  if (selectedLayers.length === 0) {
    alert("请选择至少一个图层。");
    return;
  }

  // 获取所有选中图层的信息
  var layers = [];
  for (var i = 0; i < selectedLayers.length; i++) {
    var layer = selectedLayers[i];
    var layerData = {
      layerName: layer.name,
      layerIndex: i + 1, // 使用选中的图层序列编号替换原始图层编号
      blendingMode: layer.blendingMode,
      trackMatteType: layer.trackMatteType,
      opacity: layer.transform.opacity.value,
      hasMask: layer.mask !== null,
      isHidden: layer.enabled === false,
      scale: [layer.transform.scale.value[0], layer.transform.scale.value[1]],
      effects: []
    };
    // 获取遮罩信息
    if (layer.mask instanceof MaskPropertyGroup) {
      layerData.hasMask = true;
      //layerData.maskPath = layer.mask.maskPath.value;
      // 可以在这里获取mask的其他属性
    } else {
      layerData.hasMask = false;
      layerData.maskPath = null;
    }

    // 获取每个图层的特效信息
    for (var j = 1; j <= layer.property("ADBE Effect Parade").numProperties; j++) {
      var effect = layer.property("ADBE Effect Parade").property(j);
      layerData.effects.push({
        effectName: effect.name,
        effects: effect.matchName,
        effectEnabled: effect.enabled,
        effectParameters: getEffectParameters(effect)
      });
    }
    layers.push(layerData);
  }

  // 获取保存的文件名
  var fileName = prompt("请输入保存的JSON文件名称", "0");
  if (!fileName) {
    return;
  }

  // 如果文件名已存在，则加一位数字
  var saveFile = new File(jsonFolder.fsName + "/" + fileName + ".json");
  var i = 0;
  while (saveFile.exists) {
    i++;
    saveFile = new File(jsonFolder.fsName + "/" + fileName + i + ".json");
  }

  // 将图层信息保存到JSON文件中
  if (saveFile != null) {
    saveFile.encoding = "UTF8";
    saveFile.open("w");
    saveFile.write(JSON.stringify(layers, null, "\t"));
    saveFile.close();
    alert("已保存图层信息到 " + saveFile.fsName + "。");
  }

  updateFileList(searchInput.text);

  app.endUndoGroup();

  app.cancelTask(); // 取消当前任务
  var scriptFile = new File($.fileName);
  $.evalFile(scriptFile); // 重新加载当前脚本文件

}

// 获取特效参数
function getEffectParameters(effect, index) {
  var paramList = [];
  for (var i = 1; i <= effect.numProperties; i++) {
    var prop = effect.property(i);
    var param = {
      index: i,
      name: prop.name,
      type: prop.propertyValueType,
      value: null,
      keyframes: [], // 用于存储关键帧
      expression: '' // 用于存储表达式
    };
    // 获取表达式
    try {
      param.expression = prop.expression;
    } catch (e) {
      // 表达式解析失败
    }
    switch (prop.propertyValueType) {
      case PropertyValueType.NO_VALUE:
        break;
      case PropertyValueType.OneD:
      case PropertyValueType.TwoD:
      case PropertyValueType.ThreeD:
        param.value = prop.value;
        // 存储关键帧
        if (prop.numKeys > 0) {
          for (var j = 1; j <= prop.numKeys; j++) {
            var keyframe = {
              time: prop.keyTime(j),
              value: prop.keyValue(j),
              interpolationType: prop.keyInInterpolationType(j) + ', ' + prop.keyOutInterpolationType(j)
            };
            param.keyframes.push(keyframe);
          }
        }
        break;
      case PropertyValueType.COLOR:
        param.value = [prop.value[0], prop.value[1], prop.value[2]];
        // 存储关键帧
        if (prop.numKeys > 0) {
          for (var j = 1; j <= prop.numKeys; j++) {
            var keyframe = {
              time: prop.keyTime(j),
              value: prop.keyValue(j),
              interpolationType: prop.keyInInterpolationType(j) + ', ' + prop.keyOutInterpolationType(j)
            };
            param.keyframes.push(keyframe);
          }
        }
        break;
      case PropertyValueType.CUSTOM_VALUE:
        try {
          param.value = JSON.parse(prop.expression);
        } catch (e) {
          param.value = prop.expression;
        }
        break;
      default:
        break;
    }
    paramList.push(param);
  }
  return paramList;
}

// 设置特效参数
function setEffectParameters(effect, parameters) {
  for (var i = 0; i < parameters.length; i++) {
    var paramData = parameters[i];
    var paramIndex = paramData.index;
    if (effect && paramIndex !== undefined) {
      var param = effect.property(paramIndex);
      if (param) {
        var paramValue = paramData.value;
        var keyframes = paramData.keyframes;
        try {
          if (isArray(paramValue)) {
            if (paramValue[0] && paramValue[0].hasOwnProperty("channel")) {
              // 处理复合模式（例如：蒙版，图层混合模式等）
              var compositeOrder = paramValue;
              var channels = ["RGB", "Alpha"];
              for (var c = 0; c < channels.length; c++) {
                var channel = channels[c];
                for (var j = 0; j < compositeOrder.length; j++) {
                  var order = compositeOrder[j];
                  if (order.channel === channel) {
                    var compositeIndex = order.index;
                    var newCompositeIndex = (compositeIndex + 1) % compositeOrder.length;
                    compositeOrder[j].index = newCompositeIndex;
                  }
                }
              }
              param.setValue(compositeOrder);
            } else {
              param.setValue(paramValue);
            }
          } else if (typeof paramValue === 'number') {
            param.setValue(paramValue);
          } else if (typeof paramValue === 'string') {
            param.setValue(paramValue);
          }
          // 先清除所有关键帧
          for (var j = param.numKeys; j >= 1; j--) {
            param.removeKey(j);
          }

          // 清空表达式
          param.expression = "";
          param.setValue(paramValue);

          // 设置关键帧
          for (var k = 0; k < keyframes.length; k++) {
            var keyframe = keyframes[k];
            var time = keyframe.time;
            var value = keyframe.value;
            var inInterpolationType = parseInt(keyframe.interpolationType.split(',')[0]);
            var outInterpolationType = parseInt(keyframe.interpolationType.split(',')[1]);
            param.addKey(time);
            param.setValueAtTime(time, value);
            var keyIndex = param.nearestKeyIndex(time);
            var inInterpolation = getInterpolationType(inInterpolationType);
            var outInterpolation = getInterpolationType(outInterpolationType);
            param.setInterpolationTypeAtKey(keyIndex, inInterpolation, outInterpolation);
          }

          // 设置新的表达式
          if (paramData.expression !== "") {
            param.expression = paramData.expression;
          }

          // 设置参数值
          param.setValue(paramValue);

          function getInterpolationType(type) {
            switch (type) {
              case 6612:
                return KeyframeInterpolationType.LINEAR;
              case 6613:
                return KeyframeInterpolationType.BEZIER;
              case 6614:
                return KeyframeInterpolationType.HOLD;
              default:
                return KeyframeInterpolationType.LINEAR;
            }
          }

        } catch (e) {
          // 如果出现错误就跳过该参数
        }
      }
    }
  }
}

//isArray函数
function isArray(obj) {
  return obj && typeof obj === 'object' &&
    (Object.prototype.toString.call(obj) === '[object Array]' ||
      obj.constructor === Array);
}

//关于按钮
aboutBtn.onClick = function () {
  var url = "https://github.com/yongbin1999/AE-Copy-King";
  $.writeln(system.osName);
  if ($.os.indexOf("Windows") != -1) {
    //Windows系统
    system.callSystem("cmd.exe /c\"start " + url + "\"");
  } else {
    //MAC系统
    system.callSystem("open http://" + url + "\"");
  }
};

// UI 结束区（展示）
win.layout.layout(true);
win.layout.resize();
win.onResizing = win.onResize = function () { this.layout.resize(); }
if (win instanceof Window) win.show();



/*

此AE脚本代码由YB和ChatGPT共同完成

*/
