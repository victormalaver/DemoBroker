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
        processImage = function (img) {

            function isAbsolute(img) {
                if  (img && (img.slice(0,  5)  ===  'http:' || img.slice(0,  6)  ===  'https:' || img.slice(0,  2)  ===  '//'  ||  img.slice(0,  5)  ===  'data:')) {
                    return true;
                }
                return false;
            }

            if (!img) {
                var empty1x1png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQI12NgYAAAAAMAASDVlMcAAAAASUVORK5CYII=';
                img = 'data:image/png;base64,' + empty1x1png;
            } else if (!isAbsolute(img)) {
                var setup = dataProvider.setup || {};
                img = setup.scheme + ':' + setup.url + setup.appId + '/Files/' + img + '/Download';
            }

            return img;
        },
        flattenLocationProperties = function (dataItem) {
            var propName, propValue,
                isLocation = function (value) {
                    return propValue && typeof propValue === 'object' &&
                        propValue.longitude && propValue.latitude;
                };

            for (propName in dataItem) {
                if (dataItem.hasOwnProperty(propName)) {
                    propValue = dataItem[propName];
                    if (isLocation(propValue)) {
                        dataItem[propName] =
                            kendo.format('Latitude: {0}, Longitude: {1}',
                                propValue.latitude, propValue.longitude);
                    }
                }
            }
        },
        dataSourceOptions = {
            type: 'everlive',
            transport: {
                typeName: 'siniestro',
                dataProvider: dataProvider
            },
            change: function (e) {
                var data = this.data();
                for (var i = 0; i < data.length; i++) {
                    var dataItem = data[i];

                    flattenLocationProperties(dataItem);
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
            },
            setCurrentItemByUid: function (uid) {
                var item = uid,
                    dataSource = siniestroModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);

                if (!itemModel.tipo) {
                    itemModel.tipo = String.fromCharCode(160);
                }

                siniestroModel.set('originalItem', itemModel);
                siniestroModel.set('currentItem',
                    siniestroModel.fixHierarchicalData(itemModel));

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
                longitud: '',
                latitud: '',
                tipo: '',
            });
            //mapa
            var alto = $(window).height() - $("#siniestroModelAddItemView .km-header").height();
            $("#map").css("height", alto + "px");
            if (miLatLong.length > 0) {
                var map = L.map('map').setView(miLatLong, 13);
            } else {
                miLatLong = [parseFloat(-12.0553016), parseFloat(-77.062695)];
                var map = L.map('map').setView(miLatLong, 13);
            }

            L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            var marker = L.marker(miLatLong, {
                    draggable: 'true'
                }).addTo(map)
                .bindPopup('Mi ubicación<br> Arrastre la marca.')
                .openPopup();
            marker.on("dragend", function (ev) {
                var chagedPos = ev.target.getLatLng();
                this.bindPopup(chagedPos.toString()).openPopup();
                $("#latitud").val(chagedPos.toString());
                $("#longitud").val(chagedPos.toString());
            });

        },
        setLatLong: function (e) {
            
        },
        onSaveClick: function (e) {
            var addFormData = this.get('addFormData'),
                addModel = {
                    longitud: addFormData.longitud,
                    latitud: addFormData.latitud,
                    tipo: addFormData.tipo,
                },
                filter = siniestroModel && siniestroModel.get('paramFilter'),
                dataSource = siniestroModel.get('dataSource');

            dataSource.add(addModel);
            dataSource.one('change', function (e) {
                app.mobileApp.navigate('#:back');
            });

            dataSource.sync();
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