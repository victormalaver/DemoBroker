'use strict';

app.siniestro = kendo.observable({
    onShow: function () {},
    afterShow: function () {}
});

// START_CUSTOM_CODE_siniestro
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_siniestro
(function (parent) {
    var dataProvider = app.data.brokerDemo,
        fetchFilteredData = function (paramFilter, searchFilter) {
            var model = parent.get('siniestroModel'),
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
                typeName: 'siniestro',
                dataProvider: dataProvider,
                read: {
                    headers: {
                        "X-Everlive-Expand": JSON.stringify({
                            "vehiculo": {
                                "TargetTypeName": "vehiculo",
                                "ReturnAs": "vehiculoExpanded"
                            },
                            "tipo": {
                                "TargetTypeName": "tipo",
                                "ReturnAs": "tipoExpanded"
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
                    // alert(JSON.stringify(e.xhr));
                }
            },
            schema: {
                model: {
                    fields: {
                        'tipo': {
                            field: 'tipo',
                            defaultValue: ''
                        },
                    }
                }
            },
            serverFiltering: true,
        },
        dataSource = new kendo.data.DataSource(dataSourceOptions),
        siniestroModel = kendo.observable({
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
                var dataItem = e.dataItem || siniestroModel.originalItem;

                app.mobileApp.navigate('#components/siniestro/details.html?uid=' + dataItem.uid);

            },
            addClick: function () {
                app.mobileApp.navigate('#components/siniestro/add.html');
            },
            detailsShow: function (e) {
                siniestroModel.setCurrentItemByUid(e.view.params.uid);
                var dsBrooker = app.brooker.brookerModel.dataSource;
                dsBrooker.fetch(function () {
                    var brooker = dsBrooker.get($("#brookerExpanded").text());
                    $("#brookerExpanded").text(brooker.nombre);
                });
                var dsAseguradora = app.aseguradora.aseguradoraModel.dataSource;
                dsAseguradora.fetch(function () {
                    var aseguradora = dsAseguradora.get($("#aseguradoraExpanded").text());
                    $("#aseguradoraExpanded").text(aseguradora.nombre);
                });

            },
            setCurrentItemByUid: function (uid) {
                var item = uid,
                    dataSource = siniestroModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);
                if (!itemModel.tipo) {
                    itemModel.tipo = String.fromCharCode(160);
                }
                var dsAseguradora = app.aseguradora.aseguradoraModel.dataSource;
                dsAseguradora.fetch(function () {
                    var aseguradora = dsAseguradora.get(itemModel.vehiculoExpanded.aseguradora);
                    itemModel.vehiculoExpanded.aseguradora = aseguradora.nombre;
                    if (itemModel.vehiculoExpanded.vip) {
                        itemModel.vehiculoExpanded.vip = "Ejecutivo VIP Marsh";
                        itemModel.CreatedAt = kendo.toString(itemModel.CreatedAt, "d/M/yyyy h:mm:ss tt");
                        siniestroModel.set('originalItem', itemModel);
                        siniestroModel.set('currentItem', siniestroModel.fixHierarchicalData(itemModel));
                        return itemModel;
                    } else {
                        if (itemModel.tipoExpanded.categoria == "Aseguradora") {
                            itemModel.vehiculoExpanded.vip = aseguradora.nombre + " Call Center";
                            itemModel.CreatedAt = kendo.toString(itemModel.CreatedAt, "d/M/yyyy h:mm:ss tt");
                            siniestroModel.set('originalItem', itemModel);
                            siniestroModel.set('currentItem', siniestroModel.fixHierarchicalData(itemModel));
                            return itemModel;
                        } else {
                            itemModel.vehiculoExpanded.vip = "Ejecutivo Marsh";
                            itemModel.CreatedAt = kendo.toString(itemModel.CreatedAt, "d/M/yyyy h:mm:ss tt");
                            siniestroModel.set('originalItem', itemModel);
                            siniestroModel.set('currentItem', siniestroModel.fixHierarchicalData(itemModel));
                            return itemModel;
                        }
                    }

                });
            },
            setCurrentItemCreated: function (e) {
                var item = e.view.params.uid,
                    dataSource = siniestroModel.get('dataSource'),
                    itemModel;
                dataSource.fetch(function () {
                    itemModel = dataSource.at(dataSource.total() - 1);;
                    if (!itemModel.tipo) {
                        itemModel.tipo = String.fromCharCode(160);
                    }
                    var dsAseguradora = app.aseguradora.aseguradoraModel.dataSource;
                    dsAseguradora.fetch(function () {
                        var aseguradora = dsAseguradora.get(itemModel.vehiculoExpanded.aseguradora);
                        itemModel.vehiculoExpanded.aseguradora = aseguradora.nombre;
                        if (itemModel.vehiculoExpanded.vip) {
                            itemModel.vehiculoExpanded.vip = "Si"
                            itemModel.vehiculoExpanded.vip = "Ejecutivo VIP Marsh";
                            itemModel.CreatedAt = kendo.toString(itemModel.CreatedAt, "d/M/yyyy h:mm:ss tt");
                            siniestroModel.set('originalItem', itemModel);
                            siniestroModel.set('currentItem', siniestroModel.fixHierarchicalData(itemModel));
                            return itemModel;
                        } else {
                            itemModel.vehiculoExpanded.vip = "No"
                            if (itemModel.tipoExpanded.categoria == "Aseguradora") {
                                itemModel.vehiculoExpanded.vip = aseguradora.nombre + " Call Center";
                                itemModel.CreatedAt = kendo.toString(itemModel.CreatedAt, "d/M/yyyy h:mm:ss tt");
                                siniestroModel.set('originalItem', itemModel);
                                siniestroModel.set('currentItem', siniestroModel.fixHierarchicalData(itemModel));
                                return itemModel;
                            } else {
                                itemModel.vehiculoExpanded.vip = "Ejecutivo Marsh";
                                itemModel.CreatedAt = kendo.toString(itemModel.CreatedAt, "d/M/yyyy h:mm:ss tt");
                                siniestroModel.set('originalItem', itemModel);
                                siniestroModel.set('currentItem', siniestroModel.fixHierarchicalData(itemModel));
                                return itemModel;
                            }
                        }
                        itemModel.CreatedAt = kendo.toString(itemModel.CreatedAt, "d/M/yyyy h:mm:ss tt")
                        siniestroModel.set('originalItem', itemModel);
                        siniestroModel.set('currentItem', siniestroModel.fixHierarchicalData(itemModel));
                        return itemModel;
                    });

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

    parent.set('addItemViewModel', kendo.observable({
        onShow: function (e) {
            navigator.geolocation.getCurrentPosition(function (position) {
                    miLatLong = [parseFloat(position.coords.latitude), parseFloat(position.coords.longitude)];
                    if (miLatLong.length > 0) {
                        // Reset the form data.
                        $("#formAddSiniestro").css("display", "none");
                        $("#setLatLong").css("display", "block");
                        $("#map").css("display", "block");
                        //mapa
                        $("#map").remove();
                        var divmap = "<div id='map'></div>"
                        $("#divmap").after(divmap);
                        var alto = $(window).height() - $("#siniestroModelAddItemView .km-header").height();
                        $("#map").css("height", alto + "px");

                        if (miLatLong.length > 0) {
                            var map = L.map('map').setView(miLatLong, 18);
                        } else {
                            miLatLong = [parseFloat(-12.0553016), parseFloat(-77.062695)];
                            var map = L.map('map').setView(miLatLong, 18);
                        }

                        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        }).addTo(map);

                        var myIcon = L.icon({
                            iconUrl: 'mapa/images/marker.png',
                            iconAnchor: [25, 0],
                            iconSize: [49, 69],
                        });
                        var marker = L.marker(miLatLong, {
                                draggable: 'true',
                                icon: myIcon
                            }).addTo(map)
                            .bindPopup('Si no se encuentra en la posición establecida puede arrastrar el icono, y dejar pulsado en su posición.', {
                                maxWidth: 200,
                                closeOnClick: true
                            })
                            .openPopup();
                        marker.on("dragend", function (ev) {
                            var chagedPos = ev.target.getLatLng();
                            this.bindPopup(chagedPos.toString()).openPopup();

                            var latlong = chagedPos.toString().replace("LatLng(", "").replace(")", "");
                            var miLatitud = latlong.substring(0, latlong.indexOf(","));
                            var miLongitud = latlong.substring(latlong.indexOf(",") + 1, latlong.length);
                            $("#latitud").val(miLatitud);
                            $("#longitud").val(miLongitud);
                        });

                        //cargamos ds tipo 
                        var dsTipos = app.tipos.tiposModel.dataSource;
                        dsTipos.fetch(function () {
                            var htmlBrooker = [];
                            var htmlAseguradora = [];
                            var htmlAseguradora2 = [];
                            var data = dsTipos.data();
                            for (var i = 0; i < data.length; i++) {
                                //console.log(data[i].Id + " - " + data[i].categoria + " - " + data[i].nombre);
                                if(data[i].categoria == "Brooker"){ 
                                	htmlBrooker.push('<option value="' + data[i].Id + '" categoria="' + data[i].categoria + '" >' + data[i].nombre + '</option>');    
                                }else if(data[i].categoria == "Aseguradora"){
                                    htmlAseguradora.push('<option value="' + data[i].Id + '" categoria="' + data[i].categoria + '" >' + data[i].nombre + '</option>');
                                }else{ 
                                    htmlAseguradora2.push('<option value="' + data[i].Id + '" categoria="' + data[i].categoria + '" >' + data[i].nombre + '</option>');
                                }
                                
                            }
                            $("#tipoBrooker").html(htmlBrooker);
                            $("#tipoAseguradora").html(htmlAseguradora);
                            $("#tipoAseguradora2").html(htmlAseguradora2);
                        });
                        //cargamos ds vehiculo 
                        if (localStorage.getItem("placasAsignadas") != undefined) {
                            var placasGuardadas = JSON.parse(localStorage.getItem('placasAsignadas'));
                            var html = [];
                            for (var i = 0; i < placasGuardadas.length; i++) {
                                html.push('<option value="' + placasGuardadas[i].Id + '" vip="' + placasGuardadas[i].vip + '" brooker="' + placasGuardadas[i].brooker + '" aseguradora="' + placasGuardadas[i].aseguradora + '">' + placasGuardadas[i].placa + " - " + placasGuardadas[i].marca +  '</option>');
                            }
                            $("#vehiculo").html(html);
                        }

                        // var dsVehiculo = app.vehiculo.vehiculoModel.dataSource;
                        // dsVehiculo.fetch(function () {
                        //     var html = [];
                        //     var data = dsVehiculo.data();
                        //     for (var i = 0; i < data.length; i++) {
                        //         html.push('<option value="' + data[i].Id + '" vip="' + data[i].vip + '" brooker="' + data[i].brooker + '" aseguradora="' + data[i].aseguradora + '">' + data[i].placa + '</option>');
                        //     }
                        //     $("#vehiculo").html(html);
                        // });
                    } else {
                        alert("Error");
                    }
                },
                function (error) {
                    alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
                });
        },
        setLatLong: function (e) {
            $("#contentAlertHome").html("Seleccione un vehículo y asi Solicitar Asistencia");
            openModal('modalview-alert-home');
            // $("#map").css("display", "none");
            // $("#setLatLong").css("display", "none");
            $("#formAddSiniestro").css("display", "block");
            if ($("#longitud").val() == "") {
                var latlong = miLatLong.toString();
                var miLatitud = latlong.substring(0, latlong.indexOf(","));
                var miLongitud = latlong.substring(latlong.indexOf(",") + 1, latlong.length);
                $("#latitud").val(miLatitud);
                $("#longitud").val(miLongitud);
            }
        },
        onSaveClick: function (e) {
            if ($("#formAddSiniestro #vehiculo option:selected").text() == "") {
                $("#contentAlert").html("Debe asignar un vehículo");
                closeModal('modalview-alert-home');
                openModal('modalview-alert');
                return;
            }
            kendo.mobile.application.showLoading();
            var num = "";
            if ($("#tipoAsistencia option:selected").val() == "Brooker") {
                var dsBrooker = app.brooker.brookerModel.dataSource;
                dsBrooker.fetch(function () {
                    var data = dsBrooker.data();
                    for (var i = 0; i < data.length; i++) {
                        if ($("#vehiculo option:selected").attr("brooker") == data[i].Id) {
                            num = $("#vehiculo option:selected").attr("vip").toString() == "true" ? "998393954" : data[i].numero;
                            var addModel = {
                                    longitud: $("#longitud").val(),
                                    latitud: $("#latitud").val(),
                                    tipo: $("#tipoBrooker option:selected").val(),
                                    vehiculo: $("#vehiculo option:selected").val(),
                                    numero: num
                                },
                                filter = siniestroModel && siniestroModel.get('paramFilter'),
                                dataSource = siniestroModel.get('dataSource');
                            dataSource.add(addModel);
                            dataSource.sync();
                            dataSource.one('change', function (e) {
                                app.mobileApp.navigate('#components/siniestro/siniestro.html?uid=' + e.items[0].Id);
                                kendo.mobile.application.hideLoading();
                            });
                        }
                    }
                });
            } else {
                var dsAseguradora = app.aseguradora.aseguradoraModel.dataSource;
                dsAseguradora.fetch(function () {
                    var data = dsAseguradora.data();
                    for (var i = 0; i < data.length; i++) {
                        if ($("#vehiculo option:selected").attr("aseguradora") == data[i].Id) {
                            num = $("#vehiculo option:selected").attr("vip").toString() == "true" ? "998393954" : data[i].numero;
                            var addModel = {
                                    longitud: $("#longitud").val(),
                                    latitud: $("#latitud").val(),
                                    tipo: $("#tipoAseguradora option:selected").val(),
                                    vehiculo: $("#vehiculo option:selected").val(),
                                    numero: num
                                },
                                filter = siniestroModel && siniestroModel.get('paramFilter'),
                                dataSource = siniestroModel.get('dataSource');
                            dataSource.add(addModel);
                            dataSource.sync();
                            dataSource.one('change', function (e) {
                                app.mobileApp.navigate('#components/siniestro/siniestro.html?uid=' + e.items[0].Id);
                                kendo.mobile.application.hideLoading();
                            });
                        }
                    }
                });
            }
        }
    }));

    if (typeof dataProvider.sbProviderReady === 'function') {
        dataProvider.sbProviderReady(function dl_sbProviderReady() {
            parent.set('siniestroModel', siniestroModel);
        });
    } else {
        parent.set('siniestroModel', siniestroModel);
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

})(app.siniestro);

// START_CUSTOM_CODE_siniestroModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_siniestroModel

function changeTipoAsistencia(value){
    if(value == "Brooker"){
        $("#tipoBrookerLi").css("display","block");
        $("#tipoAseguradoraLi").css("display","none");
    }else if(value == "Aseguradora"){
        $("#tipoBrookerLi").css("display","none");
        $("#tipoAseguradoraLi").css("display","block");
    }else {
        $("#tipoBrookerLi").css("display","none");
        $("#tipoAseguradoraLi").css("display","none");
        $("#tipoAseguradora2Li").css("display","block");
    }
}