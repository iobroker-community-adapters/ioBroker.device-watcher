const translations = require("./translations");
const tools = require("./tools");

/**
 * @param {object} adptName - Adaptername of devices
 */
async function createDPsForEachAdapter(adaptr, adptName) {
    await adaptr.setObjectNotExistsAsync(`devices.${adptName}`, {
        type: 'channel',
        common: {
            name: adptName,
        },
        native: {},
    });

    await adaptr.setObjectNotExistsAsync(`devices.${adptName}.offlineCount`, {
        type: 'state',
        common: {
            name: {
                en: 'Number of devices offline',
                de: 'Anzahl der Geräte offline',
                ru: '?????????? ????????? offline',
                pt: 'Número de dispositivos offline',
                nl: 'Nummer van apparatuur offline',
                fr: 'Nombre de dispositifs hors ligne',
                it: 'Numero di dispositivi offline',
                es: 'Número de dispositivos sin conexión',
                pl: 'Ilo?? urz?dze? offline',
                'zh-cn': '??????',
            },
            type: 'number',
            role: 'value',
            read: true,
            write: false,
        },
        native: {},
    });

    await adaptr.setObjectNotExistsAsync(`devices.${adptName}.offlineList`, {
        type: 'state',
        common: {
            name: {
                en: 'List of offline devices',
                de: 'Liste der Offline-Geräte',
                ru: '?????? ??????? ?????????',
                pt: 'Lista de dispositivos off-line',
                nl: 'List van offline apparatuur',
                fr: 'Liste des dispositifs hors ligne',
                it: 'Elenco dei dispositivi offline',
                es: 'Lista de dispositivos sin conexión',
                pl: 'Lista urz?dze? offline',
                'zh-cn': '?????',
            },
            type: 'array',
            role: 'json',
            read: true,
            write: false,
        },
        native: {},
    });

    await adaptr.setObjectNotExistsAsync(`devices.${adptName}.oneDeviceOffline`, {
        type: 'state',
        common: {
            name: {
                en: 'Is one device with offline',
                de: 'Ist ein Gerät mit Offline',
                ru: '??? ???? ?????????? ? offline',
                pt: 'É um dispositivo com offline',
                nl: 'Is een apparaat met offline',
                fr: 'Est un appareil avec hors ligne',
                it: 'È un dispositivo con offline',
                es: 'Es un dispositivo sin conexión',
                pl: 'Jest to jeden urz?dzenie z offlinem',
                // @ts-ignore
                uk: '? ???? ???????? ? ??????????',
                'zh-cn': '??????',
            },
            type: 'boolean',
            role: 'state',
            read: true,
            write: false,
            def: false,
        },
        native: {},
    });

    await adaptr.setObjectNotExistsAsync(`devices.${adptName}.listAllRawJSON`, {
        type: 'state',
        common: {
            name: {
                en: 'JSON RAW List of all devices',
                de: 'JSON RAW Liste aller Geräte',
                ru: '????? ??? ?????? ???? ?????????',
                pt: 'JSON RAW Lista de todos os dispositivos',
                nl: 'JSON RAW List van alle apparaten',
                fr: 'JSON RAW Liste de tous les dispositifs',
                it: 'JSON RAW Elenco di tutti i dispositivi',
                es: 'JSON RAW Lista de todos los dispositivos',
                pl: 'JSON RAW Lista wszystkich urz?dze?',
                // @ts-ignore
                uk: '????? ??? ?????? ???? ?????????',
                'zh-cn': 'JSONRAW ??????',
            },
            type: 'array',
            role: 'json',
            read: true,
            write: false,
        },
        native: {},
    });

    await adaptr.setObjectNotExistsAsync(`devices.${adptName}.listAll`, {
        type: 'state',
        common: {
            name: {
                en: 'List of all devices',
                de: 'Liste aller Geräte',
                ru: '?????? ???? ?????????',
                pt: 'Lista de todos os dispositivos',
                nl: 'List van alle apparaten',
                fr: 'Liste de tous les dispositifs',
                it: 'Elenco di tutti i dispositivi',
                es: 'Lista de todos los dispositivos',
                pl: 'Lista wszystkich urz?dze?',
                'zh-cn': '??????',
            },
            type: 'array',
            role: 'json',
            read: true,
            write: false,
        },
        native: {},
    });

    await adaptr.setObjectNotExistsAsync(`devices.${adptName}.linkQualityList`, {
        type: 'state',
        common: {
            name: {
                en: 'List of devices with signal strength',
                de: 'Liste der Geräte mit Signalstärke',
                ru: '?????? ????????? ? ????? ???????',
                pt: 'Lista de dispositivos com força de sinal',
                nl: 'List van apparaten met signaalkracht',
                fr: 'Liste des dispositifs avec force de signal',
                it: 'Elenco dei dispositivi con forza del segnale',
                es: 'Lista de dispositivos con fuerza de señal',
                pl: 'Lista urz?dze? z si?? sygna?ow?',
                'zh-cn': '???????????',
            },
            type: 'array',
            role: 'json',
            read: true,
            write: false,
        },
        native: {},
    });

    await adaptr.setObjectNotExistsAsync(`devices.${adptName}.countAll`, {
        type: 'state',
        common: {
            name: {
                en: 'Number of all devices',
                de: 'Anzahl aller Geräte',
                ru: '?????????? ???? ?????????',
                pt: 'Número de todos os dispositivos',
                nl: 'Nummer van alle apparaten',
                fr: 'Nombre de tous les appareils',
                it: 'Numero di tutti i dispositivi',
                es: 'Número de todos los dispositivos',
                pl: 'Ilo?? wszystkich urz?dze?',
                'zh-cn': '???????',
            },
            type: 'number',
            role: 'value',
            read: true,
            write: false,
        },
        native: {},
    });

    await adaptr.setObjectNotExistsAsync(`devices.${adptName}.batteryList`, {
        type: 'state',
        common: {
            name: {
                en: 'List of devices with battery state',
                de: 'Liste der Geräte mit Batteriezustand',
                ru: '?????? ????????? ? ?????????? ???????',
                pt: 'Lista de dispositivos com estado da bateria',
                nl: 'List van apparaten met batterij staat',
                fr: 'Liste des appareils avec état de batterie',
                it: 'Elenco dei dispositivi con stato della batteria',
                es: 'Lista de dispositivos con estado de batería',
                pl: 'Lista urz?dze? z bateri? stanow?',
                'zh-cn': '???????',
            },
            type: 'array',
            role: 'json',
            read: true,
            write: false,
        },
        native: {},
    });

    await adaptr.setObjectNotExistsAsync(`devices.${adptName}.lowBatteryList`, {
        type: 'state',
        common: {
            name: {
                en: 'List of devices with low battery state',
                de: 'Liste der Geräte mit niedrigem Batteriezustand',
                ru: '?????? ????????? ? ?????? ?????????? ???????',
                pt: 'Lista de dispositivos com baixo estado da bateria',
                nl: 'List van apparaten met lage batterij staat',
                fr: 'Liste des appareils à faible état de batterie',
                it: 'Elenco di dispositivi con stato di batteria basso',
                es: 'Lista de dispositivos con estado de batería bajo',
                pl: 'Lista urz?dze? o niskim stanie baterii',
                'zh-cn': '?????????',
            },
            type: 'array',
            role: 'json',
            read: true,
            write: false,
        },
        native: {},
    });

    await adaptr.setObjectNotExistsAsync(`devices.${adptName}.lowBatteryCount`, {
        type: 'state',
        common: {
            name: {
                en: 'Number of devices with low battery',
                de: 'Anzahl der Geräte mit niedriger Batterie',
                ru: '?????????? ????????? c ?????? ????????',
                pt: 'Número de dispositivos com bateria baixa',
                nl: 'Nummer van apparaten met lage batterij',
                fr: 'Nombre de dispositifs avec batterie basse',
                it: 'Numero di dispositivi con batteria bassa',
                es: 'Número de dispositivos con batería baja',
                pl: 'Liczba urz?dze? z nisk? bateri?',
                'zh-cn': '????????',
            },
            type: 'number',
            role: 'value',
            read: true,
            write: false,
        },
        native: {},
    });

    await adaptr.setObjectNotExistsAsync(`devices.${adptName}.oneDeviceLowBat`, {
        type: 'state',
        common: {
            name: {
                en: 'Is one device with low battery',
                de: 'Ist ein Gerät mit niedrigem Akku',
                ru: '???? ?????? ? ?????? ????????',
                pt: 'É um dispositivo com bateria baixa',
                nl: 'Is een apparaat met lage batterijen',
                fr: 'Est un appareil avec batterie basse',
                it: 'È un dispositivo con batteria bassa',
                es: 'Es un dispositivo con batería baja',
                pl: 'Jest to jeden urz?dzenie z nisk? bateri?',
                // @ts-ignore
                uk: '? ????? ????????? ? ??????? ????????????',
                'zh-cn': '??????',
            },
            type: 'boolean',
            role: 'state',
            read: true,
            write: false,
            def: false,
        },
        native: {},
    });

    await adaptr.setObjectNotExistsAsync(`devices.${adptName}.batteryCount`, {
        type: 'state',
        common: {
            name: {
                en: 'Number of devices with battery',
                de: 'Anzahl der Geräte mit Batterie',
                ru: '?????????? ????????? c ????????',
                pt: 'Número de dispositivos com bateria',
                nl: 'Nummer van apparaten met batterij',
                fr: 'Nombre de dispositifs avec batterie',
                it: 'Numero di dispositivi con batteria',
                es: 'Número de dispositivos con batería',
                pl: 'Liczba urz?dze? z bateri?',
                'zh-cn': '???????',
            },
            type: 'number',
            role: 'value',
            read: true,
            write: false,
        },
        native: {},
    });

    await adaptr.setObjectNotExistsAsync(`devices.${adptName}.upgradableCount`, {
        type: 'state',
        common: {
            name: {
                en: 'Number of devices with available updates ',
                de: 'Anzahl der Geräte mit verfügbaren Updates',
                ru: '?????????? ????????? ? ?????????? ????????????',
                pt: 'Número de dispositivos com atualizações disponíveis',
                nl: 'Nummer van apparatuur met beschikbare updates',
                fr: 'Nombre de dispositifs avec mises à jour disponibles',
                it: 'Numero di dispositivi con aggiornamenti disponibili',
                es: 'Número de dispositivos con actualizaciones disponibles',
                pl: 'Liczba urz?dze? z dost?pn? aktualizacj?',
                // @ts-ignore
                uk: '????????? ????????? ? ?????????? ???????????',
                'zh-cn': '?????????',
            },
            type: 'number',
            role: 'value',
            read: true,
            write: false,
        },
        native: {},
    });

    await adaptr.setObjectNotExistsAsync(`devices.${adptName}.upgradableList`, {
        type: 'state',
        common: {
            name: {
                en: 'JSON List of devices with available updates ',
                de: 'JSON Liste der Geräte mit verfügbaren Updates',
                ru: '????? ?????? ????????? ? ?????????? ????????????',
                pt: 'J. Lista de dispositivos com atualizações disponíveis',
                nl: 'JSON List van apparatuur met beschikbare updates',
                fr: 'JSON Liste des appareils avec mises à jour disponibles',
                it: 'JSON Elenco dei dispositivi con aggiornamenti disponibili',
                es: 'JSON Lista de dispositivos con actualizaciones disponibles',
                pl: 'JSON Lista urz?dze? korzystaj?cych z aktualizacji',
                // @ts-ignore
                uk: '????? ??????? ????????? ? ?????????? ???????????',
                'zh-cn': '? ? ????????',
            },
            type: 'array',
            role: 'json',
            read: true,
            write: false,
        },
        native: {},
    });

    await adaptr.setObjectNotExistsAsync(`devices.${adptName}.oneDeviceUpdatable`, {
        type: 'state',
        common: {
            name: {
                en: 'Is one device updatable',
                de: 'Ist ein Gerät aufnehmbar',
                ru: '???? ?????????? ???????????',
                pt: 'É um dispositivo updatable',
                nl: 'Is een apparaat updat',
                fr: "Est-ce qu'un appareil est indéfectible",
                it: 'È un dispositivo updatable',
                es: 'Es un dispositivo actualizado',
                pl: 'Jest to jedno urz?dzenie updatable',
                // @ts-ignore
                uk: '? ????? ?????????',
                'zh-cn': '????',
            },
            type: 'boolean',
            role: 'state',
            read: true,
            write: false,
            def: false,
        },
        native: {},
    });
}

/**
 * delete datapoints for each adapter
 * @param {object} adptName - Adaptername of devices
 */
async function deleteDPsForEachAdapter(adaptr, adptName) {
    await adaptr.delObjectAsync(`devices.${adptName}`);
    await adaptr.delObjectAsync(`devices.${adptName}.offlineCount`);
    await adaptr.delObjectAsync(`devices.${adptName}.offlineList`);
    await adaptr.delObjectAsync(`devices.${adptName}.oneDeviceOffline`);
    await adaptr.delObjectAsync(`devices.${adptName}.listAllRawJSON`);
    await adaptr.delObjectAsync(`devices.${adptName}.listAll`);
    await adaptr.delObjectAsync(`devices.${adptName}.linkQualityList`);
    await adaptr.delObjectAsync(`devices.${adptName}.countAll`);
    await adaptr.delObjectAsync(`devices.${adptName}.batteryList`);
    await adaptr.delObjectAsync(`devices.${adptName}.lowBatteryList`);
    await adaptr.delObjectAsync(`devices.${adptName}.lowBatteryCount`);
    await adaptr.delObjectAsync(`devices.${adptName}.oneDeviceLowBat`);
    await adaptr.delObjectAsync(`devices.${adptName}.batteryCount`);
    await adaptr.delObjectAsync(`devices.${adptName}.upgradableCount`);
    await adaptr.delObjectAsync(`devices.${adptName}.upgradableList`);
    await adaptr.delObjectAsync(`devices.${adptName}.oneDeviceUpdatable`);
}

/**
 * create HTML list datapoints
 * @param {object} [adptName] - Adaptername of devices
 **/
async function createHtmlListDatapoints(adaptr, adptName) {
    let dpSubFolder;
    //write the datapoints in subfolders with the adaptername otherwise write the dP's in the root folder
    if (adptName) {
        dpSubFolder = `${adptName}.`;
    } else {
        dpSubFolder = '';
    }

    await adaptr.setObjectNotExistsAsync(`devices.${dpSubFolder}offlineListHTML`, {
        type: 'state',
        common: {
            name: {
                en: 'HTML List of offline devices',
                de: 'HTML Liste der Offline-Geräte',
                ru: 'HTML ?????? ??????? ?????????',
                pt: 'HTML Lista de dispositivos off-line',
                nl: 'HTML List van offline apparatuur',
                fr: 'HTML Liste des dispositifs hors ligne',
                it: 'HTML Elenco dei dispositivi offline',
                es: 'HTML Lista de dispositivos sin conexión',
                pl: 'HTML Lista urz?dze? offline',
                'zh-cn': 'HTML ?????',
            },
            type: 'string',
            role: 'html',
            read: true,
            write: false,
        },
        native: {},
    });

    await adaptr.setObjectNotExistsAsync(`devices.${dpSubFolder}linkQualityListHTML`, {
        type: 'state',
        common: {
            name: {
                en: 'HTML List of devices with signal strength',
                de: 'HTML Liste der Geräte mit Signalstärke',
                ru: 'HTML ?????? ????????? ? ????? ???????',
                pt: 'HTML Lista de dispositivos com força de sinal',
                nl: 'HTML List van apparaten met signaalkracht',
                fr: 'HTML Liste des dispositifs avec force de signal',
                it: 'HTML Elenco dei dispositivi con forza del segnale',
                es: 'HTML Lista de dispositivos con fuerza de señal',
                pl: 'HTML Lista urz?dze? z si?? sygna?ow?',
                'zh-cn': 'HTML ???????????',
            },
            type: 'string',
            role: 'value',
            read: true,
            write: false,
        },
        native: {},
    });

    await adaptr.setObjectNotExistsAsync(`devices.${dpSubFolder}batteryListHTML`, {
        type: 'state',
        common: {
            name: {
                en: 'HTML List of devices with battery state',
                de: 'HTML Liste der Geräte mit Batteriezustand',
                ru: 'HTML ?????? ????????? ? ?????????? ???????',
                pt: 'HTML Lista de dispositivos com estado da bateria',
                nl: 'HTML List van apparaten met batterij staat',
                fr: 'HTML Liste des appareils avec état de batterie',
                it: 'HTML Elenco dei dispositivi con stato della batteria',
                es: 'HTML Lista de dispositivos con estado de batería',
                pl: 'HTML Lista urz?dze? z bateri? stanow?',
                'zh-cn': 'HTML ???????',
            },
            type: 'string',
            role: 'html',
            read: true,
            write: false,
        },
        native: {},
    });

    await adaptr.setObjectNotExistsAsync(`devices.${dpSubFolder}lowBatteryListHTML`, {
        type: 'state',
        common: {
            name: {
                en: 'HTML List of devices with low battery state',
                de: 'HTML Liste der Geräte mit niedrigem Batteriezustand',
                ru: 'HTML ?????? ????????? ? ?????? ?????????? ???????',
                pt: 'HTML Lista de dispositivos com baixo estado da bateria',
                nl: 'HTML List van apparaten met lage batterij staat',
                fr: 'HTML Liste des appareils à faible état de batterie',
                it: 'HTML Elenco di dispositivi con stato di batteria basso',
                es: 'HTML Lista de dispositivos con estado de batería bajo',
                pl: 'HTML Lista urz?dze? o niskim stanie baterii',
                'zh-cn': 'HTML ?????????',
            },
            type: 'string',
            role: 'html',
            read: true,
            write: false,
        },
        native: {},
    });
}

/**
 * delete html datapoints
 * @param {object} [adptName] - Adaptername of devices
 **/
async function deleteHtmlListDatapoints(adaptr, adptName) {
    // delete the datapoints in subfolders with the adaptername otherwise delete the dP's in the root folder
    let dpSubFolder;
    if (adptName) {
        dpSubFolder = `${adptName}.`;
    } else {
        dpSubFolder = '';
    }

    await adaptr.delObjectAsync(`devices.${dpSubFolder}offlineListHTML`);
    await adaptr.delObjectAsync(`devices.${dpSubFolder}linkQualityListHTML`);
    await adaptr.delObjectAsync(`devices.${dpSubFolder}batteryListHTML`);
    await adaptr.delObjectAsync(`devices.${dpSubFolder}lowBatteryListHTML`);
}

/**
 * create HTML list datapoints for instances
 **/
async function createHtmlListDatapointsInstances(adaptr) {
    await adaptr.setObjectNotExistsAsync(`adapterAndInstances.HTML_Lists`, {
        type: 'channel',
        common: {
            name: {
                en: 'HTML lists for adapter and instances',
                de: 'HTML-Listen für Adapter und Instanzen',
                ru: 'HTML-?????? ??? ????????? ? ?????????',
                pt: 'Listas HTML para adaptador e instâncias',
                nl: 'HTML lijsten voor adapter en instituut',
                fr: "Listes HTML pour l'adaptateur et les instances",
                it: 'Elenchi HTML per adattatore e istanze',
                es: 'Listas HTML para adaptador y casos',
                pl: 'Listy HTML dla adaptera i instancji',
                // @ts-ignore
                uk: '?????? HTML ??? ????????? ?? ???????????',
                'zh-cn': 'HTML??',
            },
        },
        native: {},
    });
    await adaptr.setObjectNotExistsAsync(`adapterAndInstances.HTML_Lists.listAllInstancesHTML`, {
        type: 'state',
        common: {
            name: {
                en: 'HTML List of all instances',
                de: 'HTML Liste aller Instanzen',
                ru: 'HTML ?????? ???? ?????????',
                pt: 'HTML Lista de todas as instâncias',
                nl: 'HTM List van alle instanties',
                fr: 'HTML Liste de tous les cas',
                it: 'HTML Elenco di tutte le istanze',
                es: 'HTML Lista de todos los casos',
                pl: 'HTML Lista wszystkich instancji',
                // @ts-ignore
                uk: '?????????? ?????? ???? ???????????',
                'zh-cn': 'HTML ???????',
            },
            type: 'string',
            role: 'html',
            read: true,
            write: false,
        },
        native: {},
    });

    await adaptr.setObjectNotExistsAsync(`adapterAndInstances.HTML_Lists.listAllActiveInstancesHTML`, {
        type: 'state',
        common: {
            name: {
                en: 'HTML List of all active instances',
                de: 'HTML Liste aller aktiven Instanzen',
                ru: 'HTML ?????? ???? ???????? ?????????',
                pt: 'HTML Lista de todas as instâncias ativas',
                nl: 'HTM List van alle actieve instanties',
                fr: 'HTML Liste de tous les cas actifs',
                it: 'HTML Elenco di tutte le istanze attive',
                es: 'HTML Lista de todos los casos activos',
                pl: 'HTML Lista wszystkich aktywnych instancji',
                // @ts-ignore
                uk: '?????????? ?????? ???? ???????? ???????????',
                'zh-cn': 'HTML ????????',
            },
            type: 'string',
            role: 'value',
            read: true,
            write: false,
        },
        native: {},
    });

    await adaptr.setObjectNotExistsAsync(`adapterAndInstances.HTML_Lists.listDeactivatedInstancesHTML`, {
        type: 'state',
        common: {
            name: {
                en: 'HTML List of all deactivated instances',
                de: 'HTML Liste aller deaktivierten Instanzen',
                ru: 'HTML ?????? ???? ???????????????? ?????????',
                pt: 'HTML Lista de todas as instâncias desativadas',
                nl: 'HTM List van alle gedeactiveerde instanties',
                fr: 'HTML Liste de tous les cas désactivés',
                it: 'HTML Elenco di tutte le istanze disattivate',
                es: 'HTML Lista de todos los casos desactivados',
                pl: 'HTML Lista wszystkich przypadków deaktywowanych',
                // @ts-ignore
                uk: '?????????? ?????? ???? ????????????? ???????????',
                'zh-cn': 'HTML ????????',
            },
            type: 'string',
            role: 'html',
            read: true,
            write: false,
        },
        native: {},
    });

    await adaptr.setObjectNotExistsAsync(`adapterAndInstances.HTML_Lists.listInstancesErrorHTML`, {
        type: 'state',
        common: {
            name: {
                en: 'HTML List of instances with error',
                de: 'HTML Liste der Fälle mit Fehler',
                ru: 'HTML ?????? ????????? ? ???????',
                pt: 'HTML Lista de casos com erro',
                nl: 'HTM List van instoringen met fouten',
                fr: 'HTML Liste des instances avec erreur',
                it: 'HTML Elenco delle istanze con errore',
                es: 'HTML Lista de casos con error',
                pl: 'HTML Lista przyk?adów z b??dem',
                // @ts-ignore
                uk: '?????????? ?????? ??????????? ? ????????',
                'zh-cn': 'HTML ?????????',
            },
            type: 'string',
            role: 'html',
            read: true,
            write: false,
        },
        native: {},
    });
    await adaptr.setObjectNotExistsAsync(`adapterAndInstances.HTML_Lists.listAdapterUpdatesHTML`, {
        type: 'state',
        common: {
            name: {
                en: 'HTML list of adapters with available updates',
                de: 'HTML-Liste der Adapter mit verfügbaren Updates',
                ru: 'HTML ?????? ????????? ? ?????????? ????????????',
                pt: 'Lista HTML de adaptadores com atualizações disponíveis',
                nl: 'HTML lijst met beschikbare updates',
                fr: 'Liste HTML des adaptateurs avec mises à jour disponibles',
                it: 'Elenco HTML degli adattatori con aggiornamenti disponibili',
                es: 'Lista HTML de adaptadores con actualizaciones disponibles',
                pl: 'Lista adapterów HTML z dost?pnymi aktualizacjami',
                // @ts-ignore
                uk: 'HTML ?????? ????????? ? ?????????? ???????????',
                'zh-cn': 'HTML ??????????',
            },
            type: 'string',
            role: 'html',
            read: true,
            write: false,
        },
        native: {},
    });
}

/**
 * delete html datapoints for instances
 **/
async function deleteHtmlListDatapointsInstances(adaptr) {
    await adaptr.delObjectAsync(`adapterAndInstances.HTML_Lists.listAllInstancesHTML`);
    await adaptr.delObjectAsync(`adapterAndInstances.HTML_Lists.listAllActiveInstancesHTML`);
    await adaptr.delObjectAsync(`adapterAndInstances.HTML_Lists.listDeactivatedInstancesHTML`);
    await adaptr.delObjectAsync(`adapterAndInstances.HTML_Lists.listInstancesErrorHTML`);
    await adaptr.delObjectAsync(`adapterAndInstances.HTML_Lists.listAdapterUpdatesHTML`);
    await adaptr.delObjectAsync(`adapterAndInstances.HTML_Lists`);
}


/*=============================================
=       functions to create html lists        =
=============================================*/
/**
 * @param {string} type - type of list
 * @param {object} devices - Device
 * @param {number} deviceCount - Counted devices
 * @param {object} isLowBatteryList - list Low Battery Devices
 */
async function createListHTML(adaptr, type, devices, deviceCount, isLowBatteryList) {
    let html;
    switch (type) {
        case 'linkQualityList':
            devices = devices.sort((a, b) => {
                a = a.Device || '';
                b = b.Device || '';
                return a.localeCompare(b);
            });
            html = `<center>
			<b>${[translations.Link_quality_devices[adaptr.config.userSelectedLanguage]]}:<font> ${deviceCount}</b><small></small></font>
			<p></p>
			</center>   
			<table width=100%>
			<tr>
			<th align=left>${[translations.Device[adaptr.config.userSelectedLanguage]]}</th>
			<th align=center width=120>${[translations.Adapter[adaptr.config.userSelectedLanguage]]}</th>
			<th align=right>${[translations.Signal_strength[adaptr.config.userSelectedLanguage]]}</th>
			</tr>
			<tr>
			<td colspan="5"><hr></td>
			</tr>`;

            for (const device of devices) {
                html += `<tr>
				<td><font>${device[translations.Device[adaptr.config.userSelectedLanguage]]}</font></td>
				<td align=center><font>${device[translations.Adapter[adaptr.config.userSelectedLanguage]]}</font></td>
				<td align=right><font>${device[translations.Signal_strength[adaptr.config.userSelectedLanguage]]}</font></td>
				</tr>`;
            }

            html += '</table>';
            break;

        case 'offlineList':
            devices = devices.sort((a, b) => {
                a = a.Device || '';
                b = b.Device || '';
                return a.localeCompare(b);
            });
            html = `<center>
			<b>${[translations.offline_devices[adaptr.config.userSelectedLanguage]]}: <font color=${deviceCount === 0 ? '#3bcf0e' : 'orange'}>${deviceCount}</b><small></small></font>
			<p></p>
			</center>   
			<table width=100%>
			<tr>
			<th align=left>${[translations.Device[adaptr.config.userSelectedLanguage]]}</th>
			<th align=center width=120>${[translations.Adapter[adaptr.config.userSelectedLanguage]]}</th>
			<th align=center>${[translations.Last_Contact[adaptr.config.userSelectedLanguage]]}</th>
			</tr>
			<tr>
			<td colspan="5"><hr></td>
			</tr>`;

            for (const device of devices) {
                html += `<tr>
				<td><font>${device[translations.Device[adaptr.config.userSelectedLanguage]]}</font></td>
				<td align=center><font>${device[translations.Adapter[adaptr.config.userSelectedLanguage]]}</font></td>
				<td align=center><font color=orange>${device[translations.Last_Contact[adaptr.config.userSelectedLanguage]]}</font></td>
				</tr>`;
            }

            html += '</table>';
            break;

        case 'batteryList':
            devices = devices.sort((a, b) => {
                a = a.Device || '';
                b = b.Device || '';
                return a.localeCompare(b);
            });
            html = `<center>
			<b>${isLowBatteryList === true ? `${[translations.low[adaptr.config.userSelectedLanguage]]} ` : ''}${[translations.battery_devices[adaptr.config.userSelectedLanguage]]}: 
			<font color=${isLowBatteryList === true ? (deviceCount > 0 ? 'orange' : '#3bcf0e') : ''}>${deviceCount}</b></font>
			<p></p>
			</center>   
			<table width=100%>
			<tr>
			<th align=left>${[translations.Device[adaptr.config.userSelectedLanguage]]}</th>
			<th align=center width=120>${[translations.Adapter[adaptr.config.userSelectedLanguage]]}</th>
			<th align=${isLowBatteryList ? 'center' : 'right'}>${[translations.Battery[adaptr.config.userSelectedLanguage]]}</th>
			</tr>
			<tr>
			<td colspan="5"><hr></td>
			</tr>`;
            for (const device of devices) {
                html += `<tr>
				<td><font>${device[translations.Device[adaptr.config.userSelectedLanguage]]}</font></td>
				<td align=center><font>${device[translations.Adapter[adaptr.config.userSelectedLanguage]]}</font></td>`;

                if (isLowBatteryList) {
                    html += `<td align=center><font color=orange>${device[translations.Battery[adaptr.config.userSelectedLanguage]]}</font></td>`;
                } else {
                    html += `<td align=right><font color=#3bcf0e>${device[translations.Battery[adaptr.config.userSelectedLanguage]]}</font></td>`;
                }
                html += `</tr>`;
            }

            html += '</table>';
            break;
    }
    return html;
}

/**
 * @param {string} type - type of list
 * @param {object} instances - Instance
 * @param {number} instancesCount - Counted devices
 */
async function createListHTMLInstances(adaptr, type, instances, instancesCount) {
    let html;
    switch (type) {
        case 'allInstancesList':
            instances = instances.sort((a, b) => {
                a = a.Instance || '';
                b = b.Instance || '';
                return a.localeCompare(b);
            });
            html = `<center>
				<b>${[translations.All_Instances[adaptr.config.userSelectedLanguage]]}:<font> ${instancesCount}</b><small></small></font>
				<p></p>
				</center>   
				<table width=100%>
				<tr>
				<th align=left>${[translations.Adapter[adaptr.config.userSelectedLanguage]]}</th>
				<th align=center>${[translations.Instance[adaptr.config.userSelectedLanguage]]}</th>
				<th align=center width=180>${[translations.Status[adaptr.config.userSelectedLanguage]]}</th>
				</tr>
				<tr>
				<td colspan="5"><hr></td>
				</tr>`;

            for (const instanceData of instances) {
                html += `<tr>
					<td><font>${instanceData[translations.Adapter[adaptr.config.userSelectedLanguage]]}</font></td>
					<td align=center><font>${instanceData[translations.Instance[adaptr.config.userSelectedLanguage]]}</font></td>
					<td align=center><font>${instanceData[translations.Status[adaptr.config.userSelectedLanguage]]}</font></td>
					</tr>`;
            }

            html += '</table>';
            break;

        case 'allActiveInstancesList':
            instances = instances.sort((a, b) => {
                a = a.Instance || '';
                b = b.Instances || '';
                return a.localeCompare(b);
            });
            html = `<center>
				<b>${[translations.Active_Instances[adaptr.config.userSelectedLanguage]]}: <font> ${instancesCount}</b><small></small></font>
				<p></p>
				</center>   
				<table width=100%>
				<tr>
				<th align=left>${[translations.Adapter[adaptr.config.userSelectedLanguage]]}</th>
				<th align=center>${[translations.Instance[adaptr.config.userSelectedLanguage]]}</th>
				<th align=center width=180>${[translations.Status[adaptr.config.userSelectedLanguage]]}</th>
				</tr>
				<tr>
				<td colspan="5"><hr></td>
				</tr>`;

            for (const instanceData of instances) {
                html += `<tr>
					<td><font>${instanceData[translations.Adapter[adaptr.config.userSelectedLanguage]]}</font></td>
					<td align=center><font>${instanceData[translations.Instance[adaptr.config.userSelectedLanguage]]}</font></td>
					<td align=center><font color=orange>${instanceData[translations.Status[adaptr.config.userSelectedLanguage]]}</font></td>
					</tr>`;
            }

            html += '</table>';
            break;

        case 'errorInstanceList':
            instances = instances.sort((a, b) => {
                a = a.Instance || '';
                b = b.Instances || '';
                return a.localeCompare(b);
            });
            html = `<center>
				<b>${[translations.Error_Instances[adaptr.config.userSelectedLanguage]]}: <font color=${instancesCount === 0 ? '#3bcf0e' : 'orange'}>${instancesCount}</b><small></small></font>
				<p></p>
				</center>   
				<table width=100%>
				<tr>
				<th align=left>${[translations.Adapter[adaptr.config.userSelectedLanguage]]}</th>
				<th align=center>${[translations.Instance[adaptr.config.userSelectedLanguage]]}</th>
				<th align=center width=180>${[translations.Status[adaptr.config.userSelectedLanguage]]}</th>
				</tr>
				<tr>
				<td colspan="5"><hr></td>
				</tr>`;

            for (const instanceData of instances) {
                html += `<tr>
					<td><font>${instanceData[translations.Adapter[adaptr.config.userSelectedLanguage]]}</font></td>
					<td align=center><font>${instanceData[translations.Instance[adaptr.config.userSelectedLanguage]]}</font></td>
					<td align=center><font color=orange>${instanceData[translations.Status[adaptr.config.userSelectedLanguage]]}</font></td>
					</tr>`;
            }

            html += '</table>';
            break;

        case 'deactivatedInstanceList':
            instances = instances.sort((a, b) => {
                a = a.Instance || '';
                b = b.Instances || '';
                return a.localeCompare(b);
            });
            html = `<center>
				<b>${[translations.Deactivated_Instances[adaptr.config.userSelectedLanguage]]}: <font color=${instancesCount === 0 ? '#3bcf0e' : 'orange'}>${instancesCount}</b><small></small></font>
				<p></p>
				</center>   
				<table width=100%>
				<tr>
				<th align=left>${[translations.Adapter[adaptr.config.userSelectedLanguage]]}</th>
				<th align=center>${[translations.Instance[adaptr.config.userSelectedLanguage]]}</th>
				<th align=center width=180>${[translations.Status[adaptr.config.userSelectedLanguage]]}</th>
				</tr>
				<tr>
				<td colspan="5"><hr></td>
				</tr>`;

            for (const instanceData of instances) {
                if (!instanceData.isAlive) {
                    html += `<tr>
					<td><font>${instanceData[translations.Adapter[adaptr.config.userSelectedLanguage]]}</font></td>
					<td align=center><font>${instanceData[translations.Instance[adaptr.config.userSelectedLanguage]]}</font></td>
					<td align=center><font color=orange>${instanceData[translations.Status[adaptr.config.userSelectedLanguage]]}</font></td>
					</tr>`;
                }
            }

            html += '</table>';
            break;

        case 'updateAdapterList':
            html = `<center>
				<b>${[translations.Updatable_adapters[adaptr.config.userSelectedLanguage]]}: <font color=${instancesCount === 0 ? '#3bcf0e' : 'orange'}>${instancesCount}</b><small></small></font>
				<p></p>
				</center>   
				<table width=100%>
				<tr>
				<th align=left>${[translations.Adapter[adaptr.config.userSelectedLanguage]]}</th>
				<th align=center>${[translations.Installed_Version[adaptr.config.userSelectedLanguage]]}</th>
				<th align=center>${[translations.Available_Version[adaptr.config.userSelectedLanguage]]}</th>
				</tr>
				<tr>
				<td colspan="5"><hr></td>
				</tr>`;

            for (const instanceData of instances.values()) {
                if (instanceData.updateAvailable !== ' - ') {
                    html += `<tr>
					<td><font>${instanceData[translations.Adapter[adaptr.config.userSelectedLanguage]]}</font></td>
					<td align=center><font>${instanceData[translations.Installed_Version[adaptr.config.userSelectedLanguage]]}</font></td>
					<td align=center><font color=orange>${instanceData[translations.Available_Version[adaptr.config.userSelectedLanguage]]}</font></td>
					</tr>`;
                }
            }

            html += '</table>';
            break;
    }
    return html;
}


/**
 * create blacklist
 */
async function createBlacklist(adaptr) {
    adaptr.log.debug(`Start the function createBlacklist`);

    // DEVICES
    const myBlacklist = adaptr.config.tableBlacklist;
    if (myBlacklist.length >= 1) {
        for (const i in myBlacklist) {
            try {
                const blacklistParse = tools.parseData(myBlacklist[i].devices);
                // push devices in list to ignor device in lists
                if (myBlacklist[i].checkIgnorLists) {
                    adaptr.blacklistLists.push(blacklistParse.path);
                }
                if (myBlacklist[i].checkIgnorAdapterLists) {
                    adaptr.blacklistAdapterLists.push(blacklistParse.path);
                }
                // push devices in list to ignor device in notifications
                if (myBlacklist[i].checkIgnorNotify) {
                    adaptr.blacklistNotify.push(blacklistParse.path);
                }
            } catch (error) {
                adaptr.log.error(`[createBlacklist] - ${error}`);
            }
            if (adaptr.blacklistLists.length >= 1) adaptr.log.info(`Found devices/services on blacklist for lists: ${adaptr.blacklistLists}`);
            if (adaptr.blacklistAdapterLists.length >= 1) adaptr.log.info(`Found devices/services on blacklist for own adapter lists: ${adaptr.blacklistAdapterLists}`);
            if (adaptr.blacklistNotify.length >= 1) adaptr.log.info(`Found devices/services on blacklist for notifications: ${adaptr.blacklistNotify}`);
        }
    }

    // INSTANCES
    const myBlacklistInstances = adaptr.config.tableBlacklistInstances;
    if (myBlacklistInstances.length >= 1) {
        for (const i in myBlacklistInstances) {
            try {
                const blacklistParse = tools.parseData(myBlacklistInstances[i].instances);
                // push devices in list to ignor device in lists
                if (myBlacklistInstances[i].checkIgnorLists) {
                    adaptr.blacklistInstancesLists.push(blacklistParse.instanceID);
                }
                // push devices in list to ignor device in notifications
                if (myBlacklistInstances[i].checkIgnorNotify) {
                    adaptr.blacklistInstancesNotify.push(blacklistParse.instanceID);
                }
            } catch (error) {
                adaptr.log.error(`[createBlacklist] - ${error}`);
            }
        }
        if (adaptr.blacklistInstancesLists.length >= 1) adaptr.log.info(`Found instances items on blacklist for lists: ${adaptr.blacklistInstancesLists}`);
        if (adaptr.blacklistInstancesNotify.length >= 1) adaptr.log.info(`Found instances items on blacklist for notifications: ${adaptr.blacklistInstancesNotify}`);
    }
}

/**
 * create list with time for instances
 */
async function createTimeListInstances(adaptr) {
    // INSTANCES
    const userTimeListInstances = adaptr.config.tableTimeInstance;
    if (userTimeListInstances.length >= 1) {
        for (const i in userTimeListInstances) {
            try {
                const userTimeListparse = tools.parseData(userTimeListInstances[i].instancesTime);
                // push devices in list to ignor device in lists
                adaptr.userTimeInstancesList.set(userTimeListparse.instanceName, {
                    deactivationTime: userTimeListInstances[i].deactivationTime,
                    errorTime: userTimeListInstances[i].errorTime,
                });
            } catch (error) {
                adaptr.log.error(`[createTimeListInstances] - ${error}`);
            }
        }
        if (adaptr.userTimeInstancesList.size >= 1) adaptr.log.info(`Found instances items on lists for timesettings: ${Array.from(adaptr.userTimeInstancesList.keys())}`);
    }
}

/**
 * @param {object} i - Device Object
 */
async function createData(adaptr, i) {
    try {
        const devices = await adaptr.getForeignStatesAsync(adaptr.selAdapter[i].Selektor);
        const adapterID = adaptr.selAdapter[i].adapterID;

        /*----------  Start of loop  ----------*/
        for (const [id] of Object.entries(devices)) {
            if (id.endsWith('.')) continue;
            const mainSelector = id;

            /*=============================================
            =              get Instanz		          =
            =============================================*/
            const instance = id.slice(0, id.indexOf('.') + 2);

            const instanceDeviceConnectionDP = `${instance}.info.connection`;
            const instancedeviceConnected = await tools.getInitValue(adaptr, instanceDeviceConnectionDP);
            adaptr.subscribeForeignStates(instanceDeviceConnectionDP);
            adaptr.subscribeForeignObjects(`${adaptr.selAdapter[i].Selektor}`);
            // adaptr.subscribeForeignObjects('*');
            //adaptr.subscribeForeignStates('*');
            /*=============================================
            =              Get device name		          =
            =============================================*/
            const deviceName = await adaptr.getDeviceName(id, i);

            /*=============================================
            =              Get adapter name		          =
            =============================================*/
            const adapter = adaptr.selAdapter[i].adapter;

            /*=============================================
            =            Get path to datapoints	   	      =
            =============================================*/
            const currDeviceString = id.slice(0, id.lastIndexOf('.') + 1 - 1);
            const shortCurrDeviceString = currDeviceString.slice(0, currDeviceString.lastIndexOf('.') + 1 - 1);

            // subscribe to object device path
            adaptr.subscribeForeignStates(currDeviceString);

            /*=============================================
            =            Get signal strength              =
            =============================================*/
            let deviceQualityDP = currDeviceString + adaptr.selAdapter[i].rssiState;
            let deviceQualityState;

            switch (adapterID) {
                case 'mihomeVacuum':
                    deviceQualityDP = shortCurrDeviceString + adaptr.selAdapter[i].rssiState;
                    deviceQualityState = await adaptr.getForeignStateAsync(deviceQualityDP);
                    break;

                case 'netatmo':
                    deviceQualityState = await adaptr.getForeignStateAsync(deviceQualityDP);
                    if (!deviceQualityState) {
                        deviceQualityDP = currDeviceString + adaptr.selAdapter[i].rfState;
                        deviceQualityState = await adaptr.getForeignStateAsync(deviceQualityDP);
                    }
                    break;

                default:
                    deviceQualityState = await adaptr.getForeignStateAsync(deviceQualityDP);
                    break;
            }
            //subscribe to states
            adaptr.subscribeForeignStates(deviceQualityDP);

            const signalData = await adaptr.calculateSignalStrength(deviceQualityState, adapterID);
            let linkQuality = signalData[0];
            const linkQualityRaw = signalData[1];

            /*=============================================
            =         	    Get battery data       	      =
            =============================================*/
            let deviceBatteryStateDP;
            let deviceBatteryState;
            let batteryHealth;
            let batteryHealthRaw;
            let batteryUnitRaw;
            let lowBatIndicator;
            let isBatteryDevice;
            let isLowBatDP;
            let faultReportingDP;
            let faultReportingState;

            const deviceChargerStateDP = currDeviceString + adaptr.selAdapter[i].charger;
            const deviceChargerState = await tools.getInitValue(adaptr, deviceChargerStateDP);

            if (deviceChargerState === undefined || deviceChargerState === false) {
                // Get battery states
                switch (adapterID) {
                    case 'hmrpc':
                        deviceBatteryStateDP = currDeviceString + adaptr.selAdapter[i].battery;
                        deviceBatteryState = await tools.getInitValue(adaptr, deviceBatteryStateDP);

                        if (deviceBatteryState === undefined) {
                            deviceBatteryStateDP = shortCurrDeviceString + adaptr.selAdapter[i].hmDNBattery;
                            deviceBatteryState = await tools.getInitValue(adaptr, deviceBatteryStateDP);
                        }
                        break;
                    case 'hueExt':
                    case 'mihomeVacuum':
                    case 'mqttNuki':
                    case 'loqedSmartLock':
                        deviceBatteryStateDP = shortCurrDeviceString + adaptr.selAdapter[i].battery;
                        deviceBatteryState = await tools.getInitValue(adaptr, deviceBatteryStateDP);

                        if (deviceBatteryState === undefined) {
                            deviceBatteryStateDP = shortCurrDeviceString + adaptr.selAdapter[i].battery2;
                            deviceBatteryState = await tools.getInitValue(adaptr, deviceBatteryStateDP);
                        }
                        break;
                    default:
                        deviceBatteryStateDP = currDeviceString + adaptr.selAdapter[i].battery;
                        deviceBatteryState = await tools.getInitValue(adaptr, deviceBatteryStateDP);

                        if (deviceBatteryState === undefined) {
                            deviceBatteryStateDP = currDeviceString + adaptr.selAdapter[i].battery2;
                            deviceBatteryState = await tools.getInitValue(adaptr, deviceBatteryStateDP);

                            if (deviceBatteryState === undefined) {
                                deviceBatteryStateDP = currDeviceString + adaptr.selAdapter[i].battery3;
                                deviceBatteryState = await tools.getInitValue(adaptr, deviceBatteryStateDP);
                            }
                        }
                        break;
                }

                // Get low bat states
                isLowBatDP = currDeviceString + adaptr.selAdapter[i].isLowBat;
                let deviceLowBatState = await tools.getInitValue(adaptr, isLowBatDP);

                if (deviceLowBatState === undefined) {
                    isLowBatDP = currDeviceString + adaptr.selAdapter[i].isLowBat2;
                    deviceLowBatState = await tools.getInitValue(adaptr, isLowBatDP);

                    if (deviceLowBatState === undefined) {
                        isLowBatDP = currDeviceString + adaptr.selAdapter[i].isLowBat3;
                        deviceLowBatState = await tools.getInitValue(adaptr, isLowBatDP);
                    }
                }
                if (deviceLowBatState === undefined) isLowBatDP = 'none';

                faultReportingDP = shortCurrDeviceString + adaptr.selAdapter[i].faultReporting;
                faultReportingState = await tools.getInitValue(adaptr, faultReportingDP);

                //subscribe to states
                adaptr.subscribeForeignStates(deviceBatteryStateDP);
                adaptr.subscribeForeignStates(isLowBatDP);
                adaptr.subscribeForeignStates(faultReportingDP);

                const batteryData = await adaptr.getBatteryData(deviceBatteryState, deviceLowBatState, faultReportingState, adapterID);
                batteryHealth = batteryData[0];
                batteryHealthRaw = batteryData[2];
                batteryUnitRaw = batteryData[3];
                isBatteryDevice = batteryData[1];

                if (isBatteryDevice) {
                    lowBatIndicator = await adaptr.setLowbatIndicator(deviceBatteryState, deviceLowBatState, faultReportingState, adapterID);
                }
            }

            /*=============================================
            =          Get last contact of device         =
            =============================================*/
            let unreachDP = currDeviceString + adaptr.selAdapter[i].reach;
            const deviceStateSelectorHMRPC = shortCurrDeviceString + adaptr.selAdapter[i].stateValue;
            const rssiPeerSelectorHMRPC = currDeviceString + adaptr.selAdapter[i].rssiPeerState;
            let timeSelector = currDeviceString + adaptr.selAdapter[i].timeSelector;

            const timeSelectorState = await tools.getInitValue(adaptr, timeSelector);
            if (timeSelectorState === undefined) {
                timeSelector = shortCurrDeviceString + adaptr.selAdapter[i].timeSelector;
            }

            let deviceUnreachState = await tools.getInitValue(adaptr, unreachDP);
            if (deviceUnreachState === undefined) {
                unreachDP = shortCurrDeviceString + adaptr.selAdapter[i].reach;
                deviceUnreachState = await tools.getInitValue(adaptr, shortCurrDeviceString + adaptr.selAdapter[i].reach);
            }

            // subscribe to states
            adaptr.subscribeForeignStates(timeSelector);
            adaptr.subscribeForeignStates(unreachDP);
            adaptr.subscribeForeignStates(deviceStateSelectorHMRPC);
            adaptr.subscribeForeignStates(rssiPeerSelectorHMRPC);

            const onlineState = await adaptr.getOnlineState(timeSelector, adapterID, unreachDP, linkQuality, deviceUnreachState, deviceStateSelectorHMRPC, rssiPeerSelectorHMRPC);
            let deviceState;
            let lastContactString;

            if (onlineState !== undefined && onlineState !== null) {
                lastContactString = onlineState[0];
                deviceState = onlineState[1];
                linkQuality = onlineState[2];
            }

            /*=============================================
        =            Get update data	              =
        =============================================*/
            let isUpgradable;
            let deviceUpdateDP;

            if (adaptr.config.checkSendDeviceUpgrade) {
                deviceUpdateDP = currDeviceString + adaptr.selAdapter[i].upgrade;
                let deviceUpdateSelector = await tools.getInitValue(adaptr, deviceUpdateDP);
                if (deviceUpdateSelector === undefined) {
                    deviceUpdateDP = shortCurrDeviceString + adaptr.selAdapter[i].upgrade;
                    deviceUpdateSelector = await tools.getInitValue(adaptr, deviceUpdateDP);
                    if (deviceUpdateSelector === undefined) {
                        const shortShortCurrDeviceString = shortCurrDeviceString.slice(0, shortCurrDeviceString.lastIndexOf('.') + 1 - 1);
                        deviceUpdateDP = shortShortCurrDeviceString + adaptr.selAdapter[i].upgrade;
                        deviceUpdateSelector = await tools.getInitValue(adaptr, deviceUpdateDP);
                    }
                }

                if (deviceUpdateSelector !== undefined) {
                    isUpgradable = await adaptr.checkDeviceUpdate(adapterID, deviceUpdateSelector);
                } else {
                    isUpgradable = ' - ';
                }

                // subscribe to states
                adaptr.subscribeForeignStates(deviceUpdateDP);
                // adaptr.subscribeForeignStates('*');
            }

            /*=============================================
            =          		  Fill Raw Lists          	  =
            =============================================*/
            const setupList = () => {
                adaptr.listAllDevicesRaw.set(currDeviceString, {
                    Path: id,
                    mainSelector: mainSelector,
                    instanceDeviceConnectionDP: instanceDeviceConnectionDP,
                    instancedeviceConnected: instancedeviceConnected,
                    instance: instance,
                    Device: deviceName,
                    adapterID: adapterID,
                    Adapter: adapter,
                    timeSelector: timeSelector,
                    isBatteryDevice: isBatteryDevice,
                    Battery: batteryHealth,
                    BatteryRaw: batteryHealthRaw,
                    BatteryUnitRaw: batteryUnitRaw,
                    batteryDP: deviceBatteryStateDP,
                    LowBat: lowBatIndicator,
                    LowBatDP: isLowBatDP,
                    faultReport: faultReportingState,
                    faultReportDP: faultReportingDP,
                    SignalStrengthDP: deviceQualityDP,
                    SignalStrength: linkQuality,
                    SignalStrengthRaw: linkQualityRaw,
                    UnreachState: deviceUnreachState,
                    UnreachDP: unreachDP,
                    deviceStateSelectorHMRPC: deviceStateSelectorHMRPC,
                    rssiPeerSelectorHMRPC: rssiPeerSelectorHMRPC,
                    LastContact: lastContactString,
                    Status: deviceState,
                    UpdateDP: deviceUpdateDP,
                    Upgradable: isUpgradable,
                });
            };

            if (!adaptr.configListOnlyBattery) {
                // Add all devices
                setupList();
            } else {
                // Add only devices with battery in the rawlist
                if (!isBatteryDevice) {
                    continue;
                }

                setupList();
            }
        } // <-- end of loop
    } catch (error) {
        adaptr.log.error(`[createData - create data of devices] - ${error}`);
    }
} // <-- end of createData


/**
 * Create Lists
 * @param {string | undefined} [adptName]
 */
async function createLists(adaptr, adptName) {
    adaptr.linkQualityDevices = [];
    adaptr.batteryPowered = [];
    adaptr.batteryLowPowered = [];
    adaptr.listAllDevicesUserRaw = [];
    adaptr.listAllDevices = [];
    adaptr.offlineDevices = [];
    adaptr.batteryLowPoweredRaw = [];
    adaptr.offlineDevicesRaw = [];
    adaptr.upgradableDevicesRaw = [];
    adaptr.upgradableList = [];

    if (adptName === undefined) {
        adptName = '';
    }

    for (const deviceData of adaptr.listAllDevicesRaw.values()) {
        /*----------  fill raw lists  ----------*/
        // low bat list
        if (deviceData.LowBat && deviceData.Status !== 'Offline') {
            adaptr.batteryLowPoweredRaw.push({
                Path: deviceData.Path,
                Device: deviceData.Device,
                Adapter: deviceData.Adapter,
                Battery: deviceData.Battery,
            });
        }
        // offline raw list
        if (deviceData.Status === 'Offline') {
            adaptr.offlineDevicesRaw.push({
                Path: deviceData.Path,
                Device: deviceData.Device,
                Adapter: deviceData.Adapter,
                LastContact: deviceData.LastContact,
            });
        }

        // upgradable raw list
        if (deviceData.Upgradable === true) {
            adaptr.upgradableDevicesRaw.push({
                Path: deviceData.Path,
                Device: deviceData.Device,
                Adapter: deviceData.Adapter,
            });
        }

        if (adptName === '' && !adaptr.blacklistLists.includes(deviceData.Path)) {
            await adaptr.theLists(deviceData);
        }

        if (adaptr.config.createOwnFolder && adptName !== '') {
            if (!deviceData.adapterID.includes(adptName)) continue;
            /*----------  fill user lists for each adapter  ----------*/
            if (adaptr.blacklistAdapterLists.includes(deviceData.Path)) continue;
            await adaptr.theLists(deviceData);
        }
    }
    await tools.countDevices(adaptr);
}


/**
 * @param {string} [adptName] - Adaptername
 */
async function writeDatapoints(adaptr, adptName) {
    // fill the datapoints
    adaptr.log.debug(`Start the function writeDatapoints`);

    try {
        let dpSubFolder;
        //write the datapoints in subfolders with the adaptername otherwise write the dP's in the root folder
        if (adptName) {
            dpSubFolder = adptName + '.';
        } else {
            dpSubFolder = '';
        }

        // Write Datapoints for counts
        await adaptr.setStateChangedAsync(`devices.${dpSubFolder}offlineCount`, { val: adaptr.offlineDevicesCount, ack: true });
        await adaptr.setStateChangedAsync(`devices.${dpSubFolder}countAll`, { val: adaptr.deviceCounter, ack: true });
        await adaptr.setStateChangedAsync(`devices.${dpSubFolder}batteryCount`, { val: adaptr.batteryPoweredCount, ack: true });
        await adaptr.setStateChangedAsync(`devices.${dpSubFolder}lowBatteryCount`, { val: adaptr.lowBatteryPoweredCount, ack: true });
        await adaptr.setStateChangedAsync(`devices.${dpSubFolder}upgradableCount`, { val: adaptr.upgradableDevicesCount, ack: true });
        // List all devices
        if (adaptr.deviceCounter === 0) {
            // if no device is count, write the JSON List with default value
            adaptr.listAllDevices = [
                {
                    [translations.Device[adaptr.config.userSelectedLanguage]]: '--none--',
                    [translations.Adapter[adaptr.config.userSelectedLanguage]]: '',
                    [translations.Battery[adaptr.config.userSelectedLanguage]]: '',
                    [translations.Signal_strength[adaptr.config.userSelectedLanguage]]: '',
                    [translations.Last_Contact[adaptr.config.userSelectedLanguage]]: '',
                    [translations.Status[adaptr.config.userSelectedLanguage]]: '',
                },
            ];
            adaptr.listAllDevicesUserRaw = [
                {
                    Device: '--none--',
                    Adapter: '',
                    Instance: '',
                    'Instance connected': '',
                    isBatteryDevice: '',
                    Battery: '',
                    BatteryRaw: '',
                    isLowBat: '',
                    'Signal strength': '',
                    'Last contact': '',
                    UpdateAvailable: '',
                    Status: '',
                },
            ];
        }
        await adaptr.setStateChangedAsync(`devices.${dpSubFolder}listAll`, { val: JSON.stringify(adaptr.listAllDevices), ack: true });
        await adaptr.setStateChangedAsync(`devices.${dpSubFolder}listAllRawJSON`, { val: JSON.stringify(adaptr.listAllDevicesUserRaw), ack: true });

        // List link quality
        if (adaptr.linkQualityCount === 0) {
            // if no device is count, write the JSON List with default value
            adaptr.linkQualityDevices = [
                {
                    [translations.Device[adaptr.config.userSelectedLanguage]]: '--none--',
                    [translations.Adapter[adaptr.config.userSelectedLanguage]]: '',
                    [translations.Signal_strength[adaptr.config.userSelectedLanguage]]: '',
                },
            ];
        }
        //write JSON list
        await adaptr.setStateChangedAsync(`devices.${dpSubFolder}linkQualityList`, {
            val: JSON.stringify(adaptr.linkQualityDevices),
            ack: true,
        });

        // List offline devices
        if (adaptr.offlineDevicesCount === 0) {
            // if no device is count, write the JSON List with default value
            adaptr.offlineDevices = [
                {
                    [translations.Device[adaptr.config.userSelectedLanguage]]: '--none--',
                    [translations.Adapter[adaptr.config.userSelectedLanguage]]: '',
                    [translations.Last_Contact[adaptr.config.userSelectedLanguage]]: '',
                },
            ];
        }
        //write JSON list
        await adaptr.setStateChangedAsync(`devices.${dpSubFolder}offlineList`, {
            val: JSON.stringify(adaptr.offlineDevices),
            ack: true,
        });

        // List updatable
        if (adaptr.upgradableDevicesCount === 0) {
            // if no device is count, write the JSON List with default value
            adaptr.upgradableList = [
                {
                    [translations.Device[adaptr.config.userSelectedLanguage]]: '--none--',
                    [translations.Adapter[adaptr.config.userSelectedLanguage]]: '',
                    [translations.Last_Contact[adaptr.config.userSelectedLanguage]]: '',
                },
            ];
        }
        //write JSON list
        await adaptr.setStateChangedAsync(`devices.${dpSubFolder}upgradableList`, {
            val: JSON.stringify(adaptr.upgradableList),
            ack: true,
        });

        // List battery powered
        if (adaptr.batteryPoweredCount === 0) {
            // if no device is count, write the JSON List with default value
            adaptr.batteryPowered = [
                {
                    [translations.Device[adaptr.config.userSelectedLanguage]]: '--none--',
                    [translations.Adapter[adaptr.config.userSelectedLanguage]]: '',
                    [translations.Battery[adaptr.config.userSelectedLanguage]]: '',
                },
            ];
        }
        //write JSON list
        await adaptr.setStateChangedAsync(`devices.${dpSubFolder}batteryList`, {
            val: JSON.stringify(adaptr.batteryPowered),
            ack: true,
        });

        // list battery low powered
        if (adaptr.lowBatteryPoweredCount === 0) {
            // if no device is count, write the JSON List with default value
            adaptr.batteryLowPowered = [
                {
                    [translations.Device[adaptr.config.userSelectedLanguage]]: '--none--',
                    [translations.Adapter[adaptr.config.userSelectedLanguage]]: '',
                    [translations.Battery[adaptr.config.userSelectedLanguage]]: '',
                },
            ];
        }
        //write JSON list
        await adaptr.setStateChangedAsync(`devices.${dpSubFolder}lowBatteryList`, {
            val: JSON.stringify(adaptr.batteryLowPowered),
            ack: true,
        });

        // set booleans datapoints
        if (adaptr.offlineDevicesCount === 0) {
            await adaptr.setStateChangedAsync(`devices.${dpSubFolder}oneDeviceOffline`, {
                val: false,
                ack: true,
            });
        } else {
            await adaptr.setStateChangedAsync(`devices.${dpSubFolder}oneDeviceOffline`, {
                val: true,
                ack: true,
            });
        }

        if (adaptr.lowBatteryPoweredCount === 0) {
            await adaptr.setStateChangedAsync(`devices.${dpSubFolder}oneDeviceLowBat`, {
                val: false,
                ack: true,
            });
        } else {
            await adaptr.setStateChangedAsync(`devices.${dpSubFolder}oneDeviceLowBat`, {
                val: true,
                ack: true,
            });
        }

        if (adaptr.upgradableDevicesCount === 0) {
            await adaptr.setStateChangedAsync(`devices.${dpSubFolder}oneDeviceUpdatable`, {
                val: false,
                ack: true,
            });
        } else {
            await adaptr.setStateChangedAsync(`devices.${dpSubFolder}oneDeviceUpdatable`, {
                val: true,
                ack: true,
            });
        }

        //write HTML list
        if (adaptr.configCreateHtmlList) {
            await adaptr.setStateChangedAsync(`devices.${dpSubFolder}linkQualityListHTML`, {
                val: await crud.createListHTML(adaptr,  'linkQualityList', adaptr.linkQualityDevices, adaptr.linkQualityCount, null),
                ack: true,
            });
            await adaptr.setStateChangedAsync(`devices.${dpSubFolder}offlineListHTML`, {
                val: await crud.createListHTML(adaptr,  'offlineList', adaptr.offlineDevices, adaptr.offlineDevicesCount, null),
                ack: true,
            });
            await adaptr.setStateChangedAsync(`devices.${dpSubFolder}batteryListHTML`, {
                val: await crud.createListHTML(adaptr,  'batteryList', adaptr.batteryPowered, adaptr.batteryPoweredCount, false),
                ack: true,
            });
            await adaptr.setStateChangedAsync(`devices.${dpSubFolder}lowBatteryListHTML`, {
                val: await crud.createListHTML(adaptr,  'batteryList', adaptr.batteryLowPowered, adaptr.lowBatteryPoweredCount, true),
                ack: true,
            });
            if (adaptr.config.checkAdapterInstances) {
                await adaptr.setStateChangedAsync(`adapterAndInstances.HTML_Lists.listAllInstancesHTML`, {
                    val: await adaptr.crud.createListHTMLInstances(adaptr,  'allInstancesList', adaptr.listAllInstances, adaptr.countAllInstances),
                    ack: true,
                });
                await adaptr.setStateChangedAsync(`adapterAndInstances.HTML_Lists.listAllActiveInstancesHTML`, {
                    val: await adaptr.crud.createListHTMLInstances(adaptr,  'allActiveInstancesList', adaptr.listAllActiveInstances, adaptr.countAllActiveInstances),
                    ack: true,
                });
                await adaptr.setStateChangedAsync(`adapterAndInstances.HTML_Lists.listInstancesErrorHTML`, {
                    val: await adaptr.crud.createListHTMLInstances(adaptr,  'errorInstanceList', adaptr.listErrorInstance, adaptr.countErrorInstance),
                    ack: true,
                });
                await adaptr.setStateChangedAsync(`adapterAndInstances.HTML_Lists.listDeactivatedInstancesHTML`, {
                    val: await adaptr.crud.createListHTMLInstances(adaptr,  'deactivatedInstanceList', adaptr.listDeactivatedInstances, adaptr.countDeactivatedInstances),
                    ack: true,
                });
                await adaptr.setStateChangedAsync(`adapterAndInstances.HTML_Lists.listAdapterUpdatesHTML`, {
                    val: await adaptr.crud.createListHTMLInstances(adaptr,  'updateAdapterList', adaptr.listAdapterUpdates, adaptr.countAdapterUpdates),
                    ack: true,
                });
            }
        }

        // create timestamp of last run
        const lastCheck = adaptr.formatDate(new Date(), 'DD.MM.YYYY') + ' - ' + adaptr.formatDate(new Date(), 'hh:mm:ss');
        await adaptr.setStateChangedAsync('lastCheck', lastCheck, true);
    } catch (error) {
        adaptr.log.error(`[writeDatapoints] - ${error}`);
    }
} //<--End  of writing Datapoints


/**
 * create Datapoints for Instances
 */
async function createDPsForInstances(adaptr) {
    await adaptr.setObjectNotExistsAsync(`adapterAndInstances`, {
        type: 'channel',
        common: {
            name: {
                en: 'Adapter and Instances',
                de: 'Adapter und Instanzen',
                ru: '??????? ? Instances',
                pt: 'Adaptador e instâncias',
                nl: 'Adapter en Instance',
                fr: 'Adaptateur et instances',
                it: 'Adattatore e istanze',
                es: 'Adaptador e instalaciones',
                pl: 'Adapter and Instances',
                // @ts-ignore
                uk: '??????? ?? ?????????',
                'zh-cn': '????',
            },
        },
        native: {},
    });

    // Instances
    await adaptr.setObjectNotExistsAsync(`adapterAndInstances.listAllInstances`, {
        type: 'state',
        common: {
            name: {
                en: 'JSON List of all instances',
                de: 'JSON Liste aller Instanzen',
                ru: '????? ?????? ???? ?????????',
                pt: 'J. Lista de todas as instâncias',
                nl: 'JSON List van alle instanties',
                fr: 'JSON Liste de tous les cas',
                it: 'JSON Elenco di tutte le istanze',
                es: 'JSON Lista de todos los casos',
                pl: 'JSON Lista wszystkich instancji',
                // @ts-ignore
                uk: '????? ?????? ???? ???????????',
                'zh-cn': '? ? ???????',
            },
            type: 'array',
            role: 'json',
            read: true,
            write: false,
        },
        native: {},
    });
    await adaptr.setObjectNotExistsAsync(`adapterAndInstances.countAllInstances`, {
        type: 'state',
        common: {
            name: {
                en: 'Number of all instances',
                de: 'Anzahl aller Instanzen',
                ru: '?????????? ???? ?????????',
                pt: 'Número de todas as instâncias',
                nl: 'Nummer van alle gevallen',
                fr: 'Nombre de cas',
                it: 'Numero di tutte le istanze',
                es: 'Número de casos',
                pl: 'Liczba wszystkich instancji',
                // @ts-ignore
                uk: '????????? ???? ???????????',
                'zh-cn': '??????',
            },
            type: 'number',
            role: 'value',
            read: true,
            write: false,
        },
        native: {},
    });
    // Instances
    await adaptr.setObjectNotExistsAsync(`adapterAndInstances.listAllActiveInstances`, {
        type: 'state',
        common: {
            name: {
                en: 'JSON List of all active instances',
                de: 'JSON Liste aller aktiven Instanzen',
                ru: '????? ?????? ???? ???????? ?????????',
                pt: 'J. Lista de todas as instâncias ativas',
                nl: 'JSON List van alle actieve instanties',
                fr: 'JSON Liste de tous les cas actifs',
                it: 'JSON Elenco di tutte le istanze attive',
                es: 'JSON Lista de todos los casos activos',
                pl: 'JSON Lista wszystkich aktywnych instancji',
                // @ts-ignore
                uk: '????? ?????? ???? ???????? ???????????',
                'zh-cn': '? ? ????????',
            },
            type: 'array',
            role: 'json',
            read: true,
            write: false,
        },
        native: {},
    });
    await adaptr.setObjectNotExistsAsync(`adapterAndInstances.countAllActiveInstances`, {
        type: 'state',
        common: {
            name: {
                en: 'Number of all active instances',
                de: 'Anzahl aller aktiven Instanzen',
                ru: '?????????? ???? ???????? ?????????',
                pt: 'Número de todas as instâncias ativas',
                nl: 'Nummer van alle actieve instanties',
                fr: 'Nombre de toutes les instances actives',
                it: 'Numero di tutte le istanze attive',
                es: 'Número de casos activos',
                pl: 'Liczba wszystkich czynnych przypadków',
                // @ts-ignore
                uk: '????????? ???? ???????? ???????????',
                'zh-cn': '?????????',
            },
            type: 'number',
            role: 'value',
            read: true,
            write: false,
        },
        native: {},
    });
    await adaptr.setObjectNotExistsAsync(`adapterAndInstances.listDeactivatedInstances`, {
        type: 'state',
        common: {
            name: {
                en: 'JSON List of deactivated instances',
                de: 'JSON Liste der deaktivierten Instanzen',
                ru: '????? ?????? ???????????????? ?????????',
                pt: 'J. Lista de instâncias desativadas',
                nl: 'JSON List van gedeactiveerde instanties',
                fr: 'JSON Liste des cas désactivés',
                it: 'JSON Elenco delle istanze disattivate',
                es: 'JSON Lista de casos desactivados',
                pl: 'JSON Lista przypadków deaktywowanych',
                // @ts-ignore
                uk: '????? ??????? ????????????? ???????????',
                'zh-cn': '? ? ??????',
            },
            type: 'array',
            role: 'json',
            read: true,
            write: false,
        },
        native: {},
    });
    await adaptr.setObjectNotExistsAsync(`adapterAndInstances.countDeactivatedInstances`, {
        type: 'state',
        common: {
            name: {
                en: 'Number of deactivated instances',
                de: 'Anzahl deaktivierter Instanzen',
                ru: '?????????? ???????????????? ?????????',
                pt: 'Número de instâncias desativadas',
                nl: 'Nummer van gedeactiveerde instanties',
                fr: 'Nombre de cas désactivés',
                it: 'Numero di istanze disattivate',
                es: 'Número de casos desactivados',
                pl: 'Liczba deaktywowanych instancji',
                // @ts-ignore
                uk: '????????? ????????????? ???????????',
                'zh-cn': 'A. ???????',
            },
            type: 'number',
            role: 'value',
            read: true,
            write: false,
        },
        native: {},
    });
    await adaptr.setObjectNotExistsAsync(`adapterAndInstances.listInstancesError`, {
        type: 'state',
        common: {
            name: {
                en: 'JSON list of instances with error',
                de: 'JSON-Liste von Instanzen mit Fehler',
                ru: 'JSON ?????? ????????? ? ???????',
                pt: 'Lista de instâncias JSON com erro',
                nl: 'JSON lijst met fouten',
                fr: 'Liste des instances avec erreur',
                it: 'Elenco JSON delle istanze con errore',
                es: 'JSON lista de casos con error',
                pl: 'Lista b??dów JSON',
                // @ts-ignore
                uk: 'JSON ?????? ??????????? ? ????????',
                'zh-cn': '??????????????',
            },
            type: 'array',
            role: 'json',
            read: true,
            write: false,
        },
        native: {},
    });
    await adaptr.setObjectNotExistsAsync(`adapterAndInstances.countInstancesError`, {
        type: 'state',
        common: {
            name: {
                en: 'Count of instances with error',
                de: 'Anzahl der Instanzen mit Fehler',
                ru: '?????????? ????????? ? ???????',
                pt: 'Contagem de instâncias com erro',
                nl: 'Graaf van instoringen met fouten',
                fr: 'Nombre de cas avec erreur',
                it: 'Conteggio di istanze con errore',
                es: 'Cuenta de casos con error',
                pl: 'Liczba przyk?adów w przypadku b??dów',
                // @ts-ignore
                uk: '????????? ??????????? ? ????????',
                'zh-cn': '???????',
            },
            type: 'number',
            role: 'value',
            read: true,
            write: false,
        },
        native: {},
    });

    // Adapter
    await adaptr.setObjectNotExistsAsync(`adapterAndInstances.listAdapterUpdates`, {
        type: 'state',
        common: {
            name: {
                en: 'JSON list of adapters with available updates',
                de: 'JSON-Liste der Adapter mit verfügbaren Updates',
                ru: 'JSON ?????? ????????? ? ?????????? ????????????',
                pt: 'Lista de adaptadores JSON com atualizações disponíveis',
                nl: 'JSON lijst met beschikbare updates',
                fr: 'Liste JSON des adaptateurs avec mises à jour disponibles',
                it: 'Elenco di adattatori JSON con aggiornamenti disponibili',
                es: 'JSON lista de adaptadores con actualizaciones disponibles',
                pl: 'JSON lista adapterów z dost?pnymi aktualizacjami',
                // @ts-ignore
                uk: 'JSON ?????? ????????? ? ?????????? ???????????',
                'zh-cn': '??A',
            },
            type: 'array',
            role: 'json',
            read: true,
            write: false,
        },
        native: {},
    });
    await adaptr.setObjectNotExistsAsync(`adapterAndInstances.countAdapterUpdates`, {
        type: 'state',
        common: {
            name: {
                en: 'Number of adapters with available updates',
                de: 'Anzahl der Adapter mit verfügbaren Updates',
                ru: '?????????? ????????? ? ?????????? ????????????',
                pt: 'Número de adaptadores com atualizações disponíveis',
                nl: 'Nummer van adapters met beschikbare updates',
                fr: "Nombre d'adaptateurs avec mises à jour disponibles",
                it: 'Numero di adattatori con aggiornamenti disponibili',
                es: 'Número de adaptadores con actualizaciones disponibles',
                pl: 'Liczba adapterów z dost?pn? aktualizacj?',
                // @ts-ignore
                uk: '????????? ????????? ? ?????????? ???????????',
                'zh-cn': '????????',
            },
            type: 'number',
            role: 'value',
            read: true,
            write: false,
        },
        native: {},
    });
}

/**
 * delete Datapoints for Instances
 */
async function deleteDPsForInstances(adaptr) {
    await adaptr.delObjectAsync(`adapterAndInstances`);
    await adaptr.delObjectAsync(`adapterAndInstances.listAllInstances`);
    await adaptr.delObjectAsync(`adapterAndInstances.countAllInstances`);
    await adaptr.delObjectAsync(`adapterAndInstances.listAllActiveInstances`);
    await adaptr.delObjectAsync(`adapterAndInstances.countAllActiveInstances`);
    await adaptr.delObjectAsync(`adapterAndInstances.listDeactivatedInstances`);
    await adaptr.delObjectAsync(`adapterAndInstances.countDeactivatedInstances`);
    await adaptr.delObjectAsync(`adapterAndInstances.listInstancesError`);
    await adaptr.delObjectAsync(`adapterAndInstances.countInstancesError`);
    await adaptr.delObjectAsync(`adapterAndInstances.listAdapterUpdates`);
    await adaptr.delObjectAsync(`adapterAndInstances.countAdapterUpdates`);
}

/**
 * create adapter update data
 */
async function createAdapterUpdateData(adaptr, adapterUpdateListDP) {

    // subscribe to datapoint
    adaptr.subscribeForeignStates(adapterUpdateListDP);

    await adaptr.getAdapterUpdateData(adapterUpdateListDP);

    await adaptr.createAdapterUpdateList();
}


module.exports = {
    createDPsForEachAdapter,
    deleteDPsForEachAdapter,
    createHtmlListDatapoints,
    deleteHtmlListDatapoints,
    createHtmlListDatapointsInstances,
    deleteHtmlListDatapointsInstances,
    createListHTML,
    createListHTMLInstances,
    createBlacklist,
    createTimeListInstances,
    createData,
    createLists,
    writeDatapoints,
    createDPsForInstances,
    deleteDPsForInstances,
    createAdapterUpdateData,

};
