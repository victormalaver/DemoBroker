'use strict';

app.vehiculo = kendo.observable({
    onShow: function () {},
    afterShow: function () {}
});

// START_CUSTOM_CODE_vehiculo
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_vehiculo
(function (parent) {
    var dataProvider = app.data.brokerDemo,
        fetchFilteredData = function (paramFilter, searchFilter) {
            var model = parent.get('vehiculoModel'),
                dataSource = model.get('dataSource');

            if (paramFilter) {
                model.set('paramFilter', paramFilter);
            } else {
                model.set('paramFilter', undefined);
            }

            if (paramFilter && searchFilter) {
                dataSource.filter({
                    logic: 'and',
                    filters: [paramFilter, searchFilter]
                });
            } else if (paramFilter || searchFilter) {
                dataSource.filter(paramFilter || searchFilter);
            } else {
                dataSource.filter({});
            }
        },
        dataSourceOptions = {
            type: 'everlive',
            transport: {
                typeName: 'vehiculo',
                dataProvider: dataProvider,
                read: {
                    headers: {
                        "X-Everlive-Expand": JSON.stringify({
                            "brooker": {
                                "TargetTypeName": "brooker",
                                "ReturnAs": "brookerExpanded"
                            },
                            "aseguradora": {
                                "TargetTypeName": "aseguradora",
                                "ReturnAs": "aseguradoraExpanded"
                            }
                        })
                    }
                }
            },
            change: function (e) {
                var data = this.data();
                for (var i = 0; i < data.length; i++) {
                    var dataItem = data[i];
                }
            },
            error: function (e) {

                if (e.xhr) {
                    alert(JSON.stringify(e.xhr));
                }
            },
            schema: {
                model: {
                    fields: {
                        'placa': {
                            field: 'placa',
                            defaultValue: ''
                        },
                        'modelo': {
                            field: 'modelo',
                            defaultValue: ''
                        },
                    }
                }
            },
            serverFiltering: true,
        },
        dataSource = new kendo.data.DataSource(dataSourceOptions),
        vehiculoModel = kendo.observable({
            dataSource: dataSource,
            fixHierarchicalData: function (data) {
                var result = {},
                    layout = {};

                $.extend(true, result, data);

                (function removeNulls(obj) {
                    var i, name,
                        names = Object.getOwnPropertyNames(obj);

                    for (i = 0; i < names.length; i++) {
                        name = names[i];

                        if (obj[name] === null) {
                            delete obj[name];
                        } else if ($.type(obj[name]) === 'object') {
                            removeNulls(obj[name]);
                        }
                    }
                })(result);

                (function fix(source, layout) {
                    var i, j, name, srcObj, ltObj, type,
                        names = Object.getOwnPropertyNames(layout);

                    for (i = 0; i < names.length; i++) {
                        name = names[i];
                        srcObj = source[name];
                        ltObj = layout[name];
                        type = $.type(srcObj);

                        if (type === 'undefined' || type === 'null') {
                            source[name] = ltObj;
                        } else {
                            if (srcObj.length > 0) {
                                for (j = 0; j < srcObj.length; j++) {
                                    fix(srcObj[j], ltObj[0]);
                                }
                            } else {
                                fix(srcObj, ltObj);
                            }
                        }
                    }
                })(result, layout);

                return result;
            },
            itemClick: function (e) {
                var dataItem = e.dataItem || vehiculoModel.originalItem;

                app.mobileApp.navigate('#components/vehiculo/details.html?uid=' + dataItem.uid);

            },
            addClick: function () {
                app.mobileApp.navigate('#components/vehiculo/add.html');
            },
            detailsShow: function (e) {
                vehiculoModel.setCurrentItemByUid(e.view.params.uid);
            },
            setCurrentItemByUid: function (uid) {
                var item = uid,
                    dataSource = vehiculoModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);

                if (!itemModel.placa) {
                    itemModel.placa = String.fromCharCode(160);
                }

                vehiculoModel.set('originalItem', itemModel);
                vehiculoModel.set('currentItem',
                    vehiculoModel.fixHierarchicalData(itemModel));

                return itemModel;
            },
            linkBind: function (linkString) {
                var linkChunks = linkString.split('|');
                if (linkChunks[0].length === 0) {
                    return this.get("currentItem." + linkChunks[1]);
                }
                return linkChunks[0] + this.get("currentItem." + linkChunks[1]);
            },
            imageBind: function (imageField) {
                if (imageField.indexOf("|") > -1) {
                    return processImage(this.get("currentItem." + imageField.split("|")[0]));
                }
                return processImage(imageField);
            },
            currentItem: {}
        });

    parent.set('addItemViewModel', kendo.observable({
        onShow: function (e) {
            // Reset the form data.
            this.set('addFormData', {
                brookerAdd: '',
                aseguradoraAdd: '',
                modelo: '',
                placa: '',
                polizaAdd: '',
            });

            //cargamos ds aseguradora 
            var dsAseguradora = app.aseguradora.aseguradoraModel.dataSource;
            dsAseguradora.fetch(function () {
                var html = [];
                var data = dsAseguradora.data();
                for (var i = 0; i < data.length; i++) {
                    html.push('<option value="' + data[i].Id + '">' + data[i].nombre + '</option>');
                }
                $("#aseguradoraAdd").html(html);
            });
             
            //cargamos ds brooker 
            var dsBrooker = app.brooker.brookerModel.dataSource;
            dsBrooker.fetch(function () {
                var html = [];
                var data = dsBrooker.data();
                for (var i = 0; i < data.length; i++) {
                    html.push('<option value="' + data[i].Id + '">' + data[i].nombre + '</option>');
                }
                $("#brookerAdd").html(html);
            });
        },
        onSaveClick: function (e) {
            var addFormData = this.get('addFormData'),
                addModel = {
                    brooker: $("#brookerAdd option:selected").val(),
                    aseguradora: $("#aseguradoraAdd option:selected").val(),
                    modelo: addFormData.modelo,
                    placa: addFormData.placa,
                    poliza: addFormData.poliza,
                },
                filter = vehiculoModel && vehiculoModel.get('paramFilter'),
                dataSource = vehiculoModel.get('dataSource');

            dataSource.add(addModel);
            dataSource.one('change', function (e) {
                app.mobileApp.navigate('#:back');
            });

            dataSource.sync();
        }
    }));

    if (typeof dataProvider.sbProviderReady === 'function') {
        dataProvider.sbProviderReady(function dl_sbProviderReady() {
            parent.set('vehiculoModel', vehiculoModel);
        });
    } else {
        parent.set('vehiculoModel', vehiculoModel);
    }

    parent.set('onShow', function (e) {
        var param = e.view.params.filter ? JSON.parse(e.view.params.filter) : null,
            isListmenu = false,
            backbutton = e.view.element && e.view.element.find('header [data-role="navbar"] .backButtonWrapper');

        if (param || isListmenu) {
            backbutton.show();
            backbutton.css('visibility', 'visible');
        } else {
            if (e.view.element.find('header [data-role="navbar"] [data-role="button"]').length) {
                backbutton.hide();
            } else {
                backbutton.css('visibility', 'hidden');
            }
        }

        fetchFilteredData(param);
    });

})(app.vehiculo);

// START_CUSTOM_CODE_vehiculoModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_vehiculoModel