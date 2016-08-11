'use strict';

app.consulta = kendo.observable({
    onShow: function () {},
    afterShow: function () {}
});
var data = localStorage.getItem('placasAsignadas');
(function (parent) {
    var dataProvider = app.data.brokerDemo,
        fetchFilteredData = function (paramFilter, searchFilter) {
            var model = parent.get('consultaModel'),
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
                    //alert(JSON.stringify(e.xhr));
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
        dataSourceLocal = data,
        consultaModel = kendo.observable({
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
                app.mobileApp.navigate('#components/consulta/details.html?uid=' + e.item[0].attributes[0].value);
            },
            addClick: function () {
                // app.mobileApp.navigate('#components/consulta/add.html');
                $("#contentAlertConsulta").html("Placa del vehículo:");
                openModal('modalview-alert-consulta');
                $("#consultaAdd").removeClass("error");
            },
            onSelectClick: function (e) {
                if ($("#consultaAdd").val() == "") {
                    $("#consultaAdd").addClass("error");
                    return;
                } else {
					$("#consultaAdd").removeClass("error");
                }
                var placa = $("#modalview-alert-consulta #consultaAdd").val().toUpperCase(),
                    dataSource = consultaModel.get('dataSource'),
                    itemModel;

                dataSource.fetch(function () {
                    var data = this.data();
                    for (var i = 0; i < data.length; i++) {
                        if (data[i].placa.toUpperCase() == placa) {
                            $("#consultaAdd").val("");
                            itemModel = data[i];
                        }
                    }
                    if ($("#consultaAdd").val() !== "") {
                        $("#contentAlertConsulta").html("Placa no registrada");
                        $("#consultaAdd").addClass("error");
                    } else {
                        $("#contentAlertConsulta").html("Placa del vehículo:");
                        $("#consultaAdd").removeClass("error");
                        asignarPlaca(itemModel);
                        closeModal('modalview-alert-consulta');
                        cargarDataLocal();
                    }
                });
            },
            detailsShow: function (e) {
                consultaModel.setCurrentItemByUid(e.view.params.uid);
            },
            setCurrentItemByUid: function (uid) {

                var item = uid,
                    dataSource = consultaModel.get('dataSource'),
                    itemModel;
                dataSource.fetch(function () {
                    var data = this.data();
                    for (var i = 0; i < data.length; i++) {
                        if (data[i].Id == item) {
                            itemModel = data[i];
                        }
                    }

                    if (!itemModel.placa) {
                        itemModel.placa = String.fromCharCode(160);
                    }
                    if (itemModel.vip) {
                        itemModel.vip = "Si"
                    } else {
                        itemModel.vip = "No"
                    }

                    consultaModel.set('originalItem', itemModel);
                    consultaModel.set('currentItem',
                        consultaModel.fixHierarchicalData(itemModel));

                    return itemModel;
                });
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

    if (typeof dataProvider.sbProviderReady === 'function') {
        dataProvider.sbProviderReady(function dl_sbProviderReady() {
            parent.set('consultaModel', consultaModel);
        });
    } else {
        parent.set('consultaModel', consultaModel);
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
        cargarDataLocal();
    });

})(app.consulta);

function asignarPlaca(itemModel) {
    var placa = itemModel.placa;
    if (localStorage.getItem("placasAsignadas") != undefined) {
        var placasGuardadas = JSON.parse(localStorage.getItem('placasAsignadas'));
        for (var i = 0; i < placasGuardadas.length; i++) {
            if (placasGuardadas[i].placa == placa) {
                $("#contentAlertConsulta").html("Placa YA ESTÁ registrada");
                $("#consultaAdd").addClass("error");
                return;
            }
        }
        placasGuardadas.push(itemModel);
        localStorage.setItem("placasAsignadas", JSON.stringify(placasGuardadas));
        var placasAsignadas = localStorage.getItem('placasAsignadas');
        var data = placasAsignadas;
    } else {
        var nuevaPlaca = [itemModel];
        localStorage.setItem("placasAsignadas", JSON.stringify(nuevaPlaca));
        var placasAsignadas = localStorage.getItem('placasAsignadas');
        var data = placasAsignadas;
    }
}

function cargarDataLocal() {
    var html = [];
    if (localStorage.getItem("placasAsignadas") != undefined) {
        var placasGuardadas = JSON.parse(localStorage.getItem('placasAsignadas'));
        for (var i = 0; i < placasGuardadas.length; i++) {
            html.push('<li data-uid="' + placasGuardadas[i].Id + '">' +
                '<div class="image-with-text">' +
                '<h3>' + placasGuardadas[i].placa + '</h3>' +
                '<p>' + placasGuardadas[i].marca + '-' + placasGuardadas[i].modelo + '</p>' +
                '</div>' +
                '</li>');
        }
        $("#masterDetailViewLocal").html(html);
    } else {
        $("#masterDetailViewLocal").html("");
    }
}