const translations = require('./translations');
const tools = require('./tools');

/**
 * @param adaptr
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
				ru: 'Количество устройств оффлайн',
				pt: 'Número de dispositivos offline',
				nl: 'Aantal offline apparaten',
				fr: 'Nombre de dispositifs hors ligne',
				it: 'Numero di dispositivi offline',
				es: 'Número de dispositivos sin conexión',
				pl: 'Liczba urządzeń offline',
				'zh-cn': '离线设备数量',
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
				ru: 'Список оффлайн устройств',
				pt: 'Lista de dispositivos offline',
				nl: 'Lijst van offline apparaten',
				fr: 'Liste des dispositifs hors ligne',
				it: 'Elenco dei dispositivi offline',
				es: 'Lista de dispositivos sin conexión',
				pl: 'Lista urządzeń offline',
				'zh-cn': '离线设备列表',
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
				en: 'Is one device offline',
				de: 'Ist ein Gerät offline',
				ru: 'Есть ли одно устройство оффлайн',
				pt: 'Há um dispositivo offline',
				nl: 'Is er een apparaat offline',
				fr: 'Y a-t-il un appareil hors ligne',
				it: "C'è un dispositivo offline",
				es: '¿Hay un dispositivo sin conexión?',
				pl: 'Czy jedno urządzenie jest offline',
				uk: 'Чи є один пристрій офлайн',
				'zh-cn': '是否有一台设备离线',
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
				ru: 'JSON RAW Список всех устройств',
				pt: 'JSON RAW Lista de todos os dispositivos',
				nl: 'JSON RAW Lijst van alle apparaten',
				fr: 'JSON RAW Liste de tous les dispositifs',
				it: 'JSON RAW Elenco di tutti i dispositivi',
				es: 'JSON RAW Lista de todos los dispositivos',
				pl: 'JSON RAW Lista wszystkich urządzeń',
				uk: 'JSON RAW Список усіх пристроїв',
				'zh-cn': 'JSON RAW 所有设备列表',
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
				ru: 'Список всех устройств',
				pt: 'Lista de todos os dispositivos',
				nl: 'Lijst van alle apparaten',
				fr: 'Liste de tous les dispositifs',
				it: 'Elenco di tutti i dispositivi',
				es: 'Lista de todos los dispositivos',
				pl: 'Lista wszystkich urządzeń',
				'zh-cn': '所有设备的列表',
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
				ru: 'Список устройств с уровнем сигнала',
				pt: 'Lista de dispositivos com força de sinal',
				nl: 'Lijst van apparaten met signaalkracht',
				fr: 'Liste des dispositifs avec force de signal',
				it: 'Elenco dei dispositivi con forza del segnale',
				es: 'Lista de dispositivos con fuerza de señal',
				pl: 'Lista urządzeń z siłą sygnału',
				'zh-cn': '具有信号强度的设备列表',
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
				ru: 'Количество всех устройств',
				pt: 'Número de todos os dispositivos',
				nl: 'Aantal van alle apparaten',
				fr: 'Nombre de tous les appareils',
				it: 'Numero di tutti i dispositivi',
				es: 'Número de todos los dispositivos',
				pl: 'Liczba wszystkich urządzeń',
				'zh-cn': '所有设备的数量',
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
				ru: 'Список устройств с состоянием батареи',
				pt: 'Lista de dispositivos com estado da bateria',
				nl: 'Lijst van apparaten met batterijstatus',
				fr: 'Liste des appareils avec état de batterie',
				it: 'Elenco dei dispositivi con stato della batteria',
				es: 'Lista de dispositivos con estado de batería',
				pl: 'Lista urządzeń ze stanem baterii',
				'zh-cn': '具有电池状态的设备列表',
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
				ru: 'Список устройств с низким уровнем заряда батареи',
				pt: 'Lista de dispositivos com baixo estado da bateria',
				nl: 'Lijst van apparaten met lage batterijstatus',
				fr: 'Liste des appareils à faible état de batterie',
				it: 'Elenco di dispositivi con stato di batteria basso',
				es: 'Lista de dispositivos con estado de batería bajo',
				pl: 'Lista urządzeń o niskim stanie baterii',
				'zh-cn': '低电量设备列表',
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
				ru: 'Количество устройств с низким зарядом батареи',
				pt: 'Número de dispositivos com bateria baixa',
				nl: 'Aantal apparaten met lage batterij',
				fr: 'Nombre de dispositifs avec batterie faible',
				it: 'Numero di dispositivi con batteria scarica',
				es: 'Número de dispositivos con batería baja',
				pl: 'Liczba urządzeń z niskim poziomem baterii',
				'zh-cn': '低电量设备的数量',
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
				ru: 'Есть ли устройство с низким зарядом батареи',
				pt: 'É um dispositivo com bateria baixa',
				nl: 'Is er een apparaat met lage batterij',
				fr: 'Y a-t-il un appareil avec batterie faible',
				it: "C'è un dispositivo con batteria scarica",
				es: '¿Hay un dispositivo con batería baja?',
				pl: 'Czy jest jedno urządzenie z niskim poziomem baterii',
				uk: 'Чи є пристрій з низьким зарядом батареї',
				'zh-cn': '是否有设备电量低',
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
				ru: 'Количество устройств с батареей',
				pt: 'Número de dispositivos com bateria',
				nl: 'Aantal apparaten met batterij',
				fr: 'Nombre de dispositifs avec batterie',
				it: 'Numero di dispositivi con batteria',
				es: 'Número de dispositivos con batería',
				pl: 'Liczba urządzeń z baterią',
				'zh-cn': '带电池的设备数量',
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
				en: 'Number of devices with available updates',
				de: 'Anzahl der Geräte mit verfügbaren Updates',
				ru: 'Количество устройств с доступными обновлениями',
				pt: 'Número de dispositivos com atualizações disponíveis',
				nl: 'Aantal apparaten met beschikbare updates',
				fr: 'Nombre de dispositifs avec mises à jour disponibles',
				it: 'Numero di dispositivi con aggiornamenti disponibili',
				es: 'Número de dispositivos con actualizaciones disponibles',
				pl: 'Liczba urządzeń z dostępnymi aktualizacjami',
				uk: 'Кількість пристроїв з доступними оновленнями',
				'zh-cn': '具有可用更新的设备数量',
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
				en: 'JSON List of devices with available updates',
				de: 'JSON Liste der Geräte mit verfügbaren Updates',
				ru: 'JSON список устройств с доступными обновлениями',
				pt: 'JSON Lista de dispositivos com atualizações disponíveis',
				nl: 'JSON Lijst van apparaten met beschikbare updates',
				fr: 'JSON Liste des appareils avec mises à jour disponibles',
				it: 'JSON Elenco dei dispositivi con aggiornamenti disponibili',
				es: 'JSON Lista de dispositivos con actualizaciones disponibles',
				pl: 'JSON Lista urządzeń z dostępnymi aktualizacjami',
				uk: 'JSON список пристроїв з доступними оновленнями',
				'zh-cn': '具有可用更新的设备的 JSON 列表',
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
				de: 'Ist ein Gerät aktualisierbar',
				ru: 'Можно ли обновить одно устройство',
				pt: 'É um dispositivo atualizável',
				nl: 'Is er een apparaat dat kan worden bijgewerkt',
				fr: 'Y a-t-il un appareil qui peut être mis à jour',
				it: "C'è un dispositivo aggiornabile",
				es: '¿Hay un dispositivo actualizable?',
				pl: 'Czy jest jedno urządzenie do zaktualizowania',
				uk: 'Чи є пристрій, який можна оновити',
				'zh-cn': '是否有设备可更新',
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
 *
 * @param adaptr
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
 *
 * @param adaptr
 * @param {object} [adptName] - Adaptername of devices
 */
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
				ru: 'HTML список оффлайн устройств',
				pt: 'HTML Lista de dispositivos offline',
				nl: 'HTML Lijst van offline apparaten',
				fr: 'HTML Liste des dispositifs hors ligne',
				it: 'HTML Elenco dei dispositivi offline',
				es: 'HTML Lista de dispositivos sin conexión',
				pl: 'HTML Lista urządzeń offline',
				'zh-cn': 'HTML 离线设备列表',
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
				ru: 'HTML список устройств с уровнем сигнала',
				pt: 'HTML Lista de dispositivos com força de sinal',
				nl: 'HTML Lijst van apparaten met signaalkracht',
				fr: 'HTML Liste des dispositifs avec force de signal',
				it: 'HTML Elenco dei dispositivi con forza del segnale',
				es: 'HTML Lista de dispositivos con fuerza de señal',
				pl: 'HTML Lista urządzeń z siłą sygnału',
				'zh-cn': 'HTML 具有信号强度的设备列表',
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
				ru: 'HTML список устройств с состоянием батареи',
				pt: 'HTML Lista de dispositivos com estado da bateria',
				nl: 'HTML Lijst van apparaten met batterijstatus',
				fr: 'HTML Liste des appareils avec état de batterie',
				it: 'HTML Elenco dei dispositivi con stato della batteria',
				es: 'HTML Lista de dispositivos con estado de batería',
				pl: 'HTML Lista urządzeń ze stanem baterii',
				'zh-cn': 'HTML 具有电池状态的设备列表',
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
				ru: 'HTML список устройств с низким уровнем заряда батареи',
				pt: 'HTML Lista de dispositivos com baixo estado da bateria',
				nl: 'HTML Lijst van apparaten met lage batterijstatus',
				fr: 'HTML Liste des appareils à faible état de batterie',
				it: 'HTML Elenco di dispositivi con stato di batteria basso',
				es: 'HTML Lista de dispositivos con estado de batería bajo',
				pl: 'HTML Lista urządzeń o niskim stanie baterii',
				'zh-cn': 'HTML 低电量设备列表',
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
 *
 * @param adaptr
 * @param {object} [adptName] - Adaptername of devices
 */
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
 *
 * @param adaptr
 */
async function createHtmlListDatapointsInstances(adaptr) {
	await adaptr.setObjectNotExistsAsync(`adapterAndInstances.HTML_Lists`, {
		type: 'channel',
		common: {
			name: {
				en: 'HTML lists for adapter and instances',
				de: 'HTML-Listen für Adapter und Instanzen',
				ru: 'HTML списки для адаптера и экземпляров',
				pt: 'Listas HTML para adaptador e instâncias',
				nl: 'HTML lijsten voor adapter en instanties',
				fr: "Listes HTML pour l'adaptateur et les instances",
				it: 'Elenchi HTML per adattatore e istanze',
				es: 'Listas HTML para adaptador e instancias',
				pl: 'Listy HTML dla adaptera i instancji',
				uk: 'HTML списки для адаптера та екземплярів',
				'zh-cn': '适配器和实例的 HTML 列表',
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
				ru: 'HTML список всех экземпляров',
				pt: 'HTML Lista de todas as instâncias',
				nl: 'HTML Lijst van alle instanties',
				fr: 'HTML Liste de toutes les instances',
				it: 'HTML Elenco di tutte le istanze',
				es: 'HTML Lista de todas las instancias',
				pl: 'HTML Lista wszystkich instancji',
				uk: 'HTML список усіх екземплярів',
				'zh-cn': 'HTML 所有实例的列表',
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
				ru: 'HTML список всех активных экземпляров',
				pt: 'HTML Lista de todas as instâncias ativas',
				nl: 'HTML Lijst van alle actieve instanties',
				fr: 'HTML Liste de toutes les instances actives',
				it: 'HTML Elenco di tutte le istanze attive',
				es: 'HTML Lista de todas las instancias activas',
				pl: 'HTML Lista wszystkich aktywnych instancji',
				uk: 'HTML список усіх активних екземплярів',
				'zh-cn': 'HTML 所有活动实例的列表',
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
				ru: 'HTML список всех деактивированных экземпляров',
				pt: 'HTML Lista de todas as instâncias desativadas',
				nl: 'HTML Lijst van alle gedeactiveerde instanties',
				fr: 'HTML Liste de toutes les instances désactivées',
				it: 'HTML Elenco di tutte le istanze disattivate',
				es: 'HTML Lista de todas las instancias desactivadas',
				pl: 'HTML Lista wszystkich dezaktywowanych instancji',
				uk: 'HTML список усіх деактивованих екземплярів',
				'zh-cn': 'HTML 所有已停用实例的列表',
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
				de: 'HTML Liste der Instanzen mit Fehler',
				ru: 'HTML список экземпляров с ошибкой',
				pt: 'HTML Lista de instâncias com erro',
				nl: 'HTML Lijst van instanties met fouten',
				fr: 'HTML Liste des instances avec erreur',
				it: 'HTML Elenco delle istanze con errore',
				es: 'HTML Lista de instancias con error',
				pl: 'HTML Lista instancji z błędem',
				uk: 'HTML список екземплярів з помилкою',
				'zh-cn': 'HTML 含错误实例的列表',
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
				ru: 'HTML список адаптеров с доступными обновлениями',
				pt: 'Lista HTML de adaptadores com atualizações disponíveis',
				nl: 'HTML lijst van adapters met beschikbare updates',
				fr: 'Liste HTML des adaptateurs avec mises à jour disponibles',
				it: 'Elenco HTML degli adattatori con aggiornamenti disponibili',
				es: 'Lista HTML de adaptadores con actualizaciones disponibles',
				pl: 'Lista adapterów HTML z dostępnymi aktualizacjami',
				uk: 'HTML список адаптерів з доступними оновленнями',
				'zh-cn': 'HTML 具有可用更新的适配器列表',
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
 *
 * @param adaptr
 */
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
 * @param adaptr
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
 * @param adaptr
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
 *
 * @param adaptr
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
			if (adaptr.blacklistLists.length >= 1) {
				adaptr.log.info(`Found devices/services on blacklist for lists: ${adaptr.blacklistLists}`);
			}
			if (adaptr.blacklistAdapterLists.length >= 1) {
				adaptr.log.info(`Found devices/services on blacklist for own adapter lists: ${adaptr.blacklistAdapterLists}`);
			}
			if (adaptr.blacklistNotify.length >= 1) {
				adaptr.log.info(`Found devices/services on blacklist for notifications: ${adaptr.blacklistNotify}`);
			}
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
		if (adaptr.blacklistInstancesLists.length >= 1) {
			adaptr.log.info(`Found instances items on blacklist for lists: ${adaptr.blacklistInstancesLists}`);
		}
		if (adaptr.blacklistInstancesNotify.length >= 1) {
			adaptr.log.info(`Found instances items on blacklist for notifications: ${adaptr.blacklistInstancesNotify}`);
		}
	}
}

/**
 * create list with time for instances
 *
 * @param adaptr
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
		if (adaptr.userTimeInstancesList.size >= 1) {
			adaptr.log.info(`Found instances items on lists for timesettings: ${Array.from(adaptr.userTimeInstancesList.keys())}`);
		}
	}
}

/**
 * @param adaptr
 * @param {object} i - Device Object
 */
async function createData(adaptr, i) {
	try {
		const devices = await adaptr.getForeignStatesAsync(adaptr.selAdapter[i].selektor);
		const adapterID = adaptr.selAdapter[i].adapterID;

		/*----------  Start of loop  ----------*/
		for (const [id] of Object.entries(devices)) {
			if (id.endsWith('.')) {
				continue;
			}
			const mainSelector = id;

			/*=============================================
            =              get Instanz		          =
            =============================================*/
			const instance = id.slice(0, id.indexOf('.') + 2);

			let instanceDeviceConnectionDP = `${instance}.info.connection`;
			let instanceDeviceConnected = await tools.getInitValue(adaptr, instanceDeviceConnectionDP);

			if (instanceDeviceConnected === undefined) {
				const sysAdmin = `system.adapter.${instanceDeviceConnectionDP.replace('info.connection', 'connected')}`;
				instanceDeviceConnectionDP = sysAdmin;
				instanceDeviceConnected = await tools.getInitValue(adaptr, sysAdmin);
			}

			adaptr.subscribeForeignStates(instanceDeviceConnectionDP);
			adaptr.subscribeForeignObjects(`${adaptr.selAdapter[i].selektor}`);

			const deviceName = await adaptr.getDeviceName(id, i);

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
			let linkQuality;
			let linkQualityRaw;

			if (!deviceQualityDP.includes('undefined')) {
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
				}
				//subscribe to states
				adaptr.subscribeForeignStates(deviceQualityDP);

				const signalData = await adaptr.calculateSignalStrength(deviceQualityState, adapterID);
				linkQuality = signalData[0];
				linkQualityRaw = signalData[1];
			}

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
				if (deviceLowBatState === undefined) {
					isLowBatDP = 'none';
				}

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
			let deviceStateSelectorHMRPC;
			let rssiPeerSelectorHMRPC;

			// HMRPC
			if (adaptr.selAdapter[i].stateValue != undefined) {
				deviceStateSelectorHMRPC = shortCurrDeviceString + adaptr.selAdapter[i].stateValue;
				rssiPeerSelectorHMRPC = currDeviceString + adaptr.selAdapter[i].rssiPeerState;
				adaptr.subscribeForeignStates(deviceStateSelectorHMRPC);
				adaptr.subscribeForeignStates(rssiPeerSelectorHMRPC);
			}

			let timeSelector = currDeviceString + adaptr.selAdapter[i].timeSelector;
			const timeSelectorState = await tools.getInitValue(adaptr, timeSelector);

			if (timeSelectorState === undefined) {
				timeSelector = shortCurrDeviceString + adaptr.selAdapter[i].timeSelector;
			}

			let unreachDP = currDeviceString + adaptr.selAdapter[i].reach;
			let deviceUnreachState = await tools.getInitValue(adaptr, unreachDP);
			if (deviceUnreachState === undefined) {
				unreachDP = shortCurrDeviceString + adaptr.selAdapter[i].reach;
				deviceUnreachState = await tools.getInitValue(adaptr, shortCurrDeviceString + adaptr.selAdapter[i].reach);
			}

			// subscribe to states
			adaptr.subscribeForeignStates(timeSelector);
			adaptr.subscribeForeignStates(unreachDP);

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
					instanceDeviceConnected: instanceDeviceConnected,
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
 *
 * @param adaptr
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
			if (!deviceData.adapterID.includes(adptName)) {
				continue;
			}
			/*----------  fill user lists for each adapter  ----------*/
			if (adaptr.blacklistAdapterLists.includes(deviceData.Path)) {
				continue;
			}
			await adaptr.theLists(deviceData);
		}
	}
	await tools.countDevices(adaptr);
}

/**
 * @param adaptr
 * @param {string} [adptName] - Adaptername
 */
async function writeDatapoints(adaptr, adptName) {
	// fill the datapoints
	adaptr.log.debug(`Start the function writeDatapoints`);

	try {
		let dpSubFolder;
		//write the datapoints in subfolders with the adaptername otherwise write the dP's in the root folder
		if (adptName) {
			dpSubFolder = `${adptName}.`;
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
				val: await this.createListHTML(adaptr, 'linkQualityList', adaptr.linkQualityDevices, adaptr.linkQualityCount, null),
				ack: true,
			});
			await adaptr.setStateChangedAsync(`devices.${dpSubFolder}offlineListHTML`, {
				val: await this.createListHTML(adaptr, 'offlineList', adaptr.offlineDevices, adaptr.offlineDevicesCount, null),
				ack: true,
			});
			await adaptr.setStateChangedAsync(`devices.${dpSubFolder}batteryListHTML`, {
				val: await this.createListHTML(adaptr, 'batteryList', adaptr.batteryPowered, adaptr.batteryPoweredCount, false),
				ack: true,
			});
			await adaptr.setStateChangedAsync(`devices.${dpSubFolder}lowBatteryListHTML`, {
				val: await this.createListHTML(adaptr, 'batteryList', adaptr.batteryLowPowered, adaptr.lowBatteryPoweredCount, true),
				ack: true,
			});

			if (adaptr.config.checkAdapterInstances) {
				await adaptr.setStateChangedAsync(`adapterAndInstances.HTML_Lists.listAllInstancesHTML`, {
					val: await this.createListHTMLInstances(adaptr, 'allInstancesList', adaptr.listAllInstances, adaptr.countAllInstances),
					ack: true,
				});
				await adaptr.setStateChangedAsync(`adapterAndInstances.HTML_Lists.listAllActiveInstancesHTML`, {
					val: await this.createListHTMLInstances(adaptr, 'allActiveInstancesList', adaptr.listAllActiveInstances, adaptr.countAllActiveInstances),
					ack: true,
				});
				await adaptr.setStateChangedAsync(`adapterAndInstances.HTML_Lists.listInstancesErrorHTML`, {
					val: await this.createListHTMLInstances(adaptr, 'errorInstanceList', adaptr.listErrorInstance, adaptr.countErrorInstance),
					ack: true,
				});
				await adaptr.setStateChangedAsync(`adapterAndInstances.HTML_Lists.listDeactivatedInstancesHTML`, {
					val: await this.createListHTMLInstances(adaptr, 'deactivatedInstanceList', adaptr.listDeactivatedInstances, adaptr.countDeactivatedInstances),
					ack: true,
				});
				await adaptr.setStateChangedAsync(`adapterAndInstances.HTML_Lists.listAdapterUpdatesHTML`, {
					val: await this.createListHTMLInstances(adaptr, 'updateAdapterList', adaptr.listAdapterUpdates, adaptr.countAdapterUpdates),
					ack: true,
				});
			}
		}

		// create timestamp of last run
		const lastCheck = `${adaptr.formatDate(new Date(), 'DD.MM.YYYY')} - ${adaptr.formatDate(new Date(), 'hh:mm:ss')}`;
		await adaptr.setStateChangedAsync('lastCheck', lastCheck, true);
	} catch (error) {
		adaptr.log.error(`[writeDatapoints] - ${error}`);
	}
} //<--End  of writing Datapoints

/**
 * create Datapoints for Instances
 *
 * @param adaptr
 */
async function createDPsForInstances(adaptr) {
	await adaptr.setObjectNotExistsAsync(`adapterAndInstances`, {
		type: 'channel',
		common: {
			name: {
				en: 'Adapter and Instances',
				de: 'Adapter und Instanzen',
				ru: 'Адаптер и экземпляры',
				pt: 'Adaptador e Instâncias',
				nl: 'Adapter en Instanties',
				fr: 'Adaptateur et instances',
				it: 'Adattatore e istanze',
				es: 'Adaptador e instancias',
				pl: 'Adapter i Instancje',
				uk: 'Адаптер та його екземпляри',
				'zh-cn': '适配器和实例',
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
				de: 'JSON-Liste aller Instanzen',
				ru: 'JSON-список всех экземпляров',
				pt: 'Lista JSON de todas as instâncias',
				nl: 'JSON-lijst van alle instanties',
				fr: 'Liste JSON de toutes les instances',
				it: 'Elenco JSON di tutte le istanze',
				es: 'Lista JSON de todas las instancias',
				pl: 'Lista JSON wszystkich instancji',
				uk: 'JSON-список всіх інстанцій',
				'zh-cn': '所有实例的JSON列表',
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
				ru: 'Количество всех экземпляров',
				pt: 'Número de todas as instâncias',
				nl: 'Aantal van alle instanties',
				fr: 'Nombre de toutes les instances',
				it: 'Numero di tutte le istanze',
				es: 'Número de todas las instancias',
				pl: 'Liczba wszystkich instancji',
				uk: 'Кількість усіх інстанцій',
				'zh-cn': '所有实例的数量',
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
				de: 'JSON-Liste aller aktiven Instanzen',
				ru: 'JSON список всех активных экземпляров',
				pt: 'Lista JSON de todas as instâncias ativas',
				nl: 'JSON-lijst van alle actieve instanties',
				fr: 'Liste JSON de toutes les instances actives',
				it: 'Elenco JSON di tutte le istanze attive',
				es: 'Lista JSON de todas las instancias activas',
				pl: 'JSON lista wszystkich aktywnych instancji',
				uk: 'JSON список усіх активних екземплярів',
				'zh-cn': '所有活动实例的 JSON 列表',
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
				ru: 'Количество всех активных экземпляров',
				pt: 'Número de todas as instâncias ativas',
				nl: 'Aantal van alle actieve instanties',
				fr: 'Nombre de toutes les instances actives',
				it: 'Numero di tutte le istanze attive',
				es: 'Número de todas las instancias activas',
				pl: 'Liczba wszystkich aktywnych instancji',
				uk: 'Кількість усіх активних екземплярів',
				'zh-cn': '所有活动实例的数量',
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
				de: 'JSON-Liste der deaktivierten Instanzen',
				ru: 'JSON список деактивированных экземпляров',
				pt: 'JSON Lista de instâncias desativadas',
				nl: 'JSON-lijst van gedeactiveerde instanties',
				fr: 'Liste JSON des instances désactivées',
				it: 'JSON Elenco delle istanze disattivate',
				es: 'Lista JSON de instancias desactivadas',
				pl: 'JSON lista dezaktywowanych instancji',
				uk: 'JSON список деактивованих екземплярів',
				'zh-cn': '已停用实例的 JSON 列表',
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
				ru: 'Количество деактивированных экземпляров',
				pt: 'Número de instâncias desativadas',
				nl: 'Aantal gedeactiveerde instanties',
				fr: "Nombre d'instances désactivées",
				it: 'Numero di istanze disattivate',
				es: 'Número de instancias desactivadas',
				pl: 'Liczba deaktywowanych instancji',
				uk: 'Кількість деактивованих екземплярів',
				'zh-cn': '已停用实例的数量',
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
				ru: 'JSON список экземпляров с ошибкой',
				pt: 'Lista de instâncias JSON com erro',
				nl: 'JSON lijst met fouten',
				fr: 'Liste des instances avec erreur',
				it: 'Elenco JSON delle istanze con errore',
				es: 'JSON lista de casos con error',
				pl: 'JSON lista instancji z błędem',
				uk: 'JSON список інстанцій з помилкою',
				'zh-cn': '含错误实例的 JSON 列表',
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
				ru: 'Количество экземпляров с ошибкой',
				pt: 'Contagem de instâncias com erro',
				nl: 'Aantal instanties met fouten',
				fr: "Nombre d'instances avec erreur",
				it: 'Conteggio delle istanze con errore',
				es: 'Recuento de instancias con error',
				pl: 'Liczba instancji z błędem',
				uk: 'Кількість інстанцій з помилкою',
				'zh-cn': '出错实例的数量',
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
				ru: 'JSON список адаптеров с доступными обновлениями',
				pt: 'Lista de adaptadores JSON com atualizações disponíveis',
				nl: 'JSON lijst van adapters met beschikbare updates',
				fr: 'Liste JSON des adaptateurs avec mises à jour disponibles',
				it: 'Elenco JSON degli adattatori con aggiornamenti disponibili',
				es: 'JSON lista de adaptadores con actualizaciones disponibles',
				pl: 'JSON lista adapterów z dostępnymi aktualizacjami',
				uk: 'JSON список адаптерів з доступними оновленнями',
				'zh-cn': '具有可用更新的适配器的 JSON 列表',
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
				ru: 'Количество адаптеров с доступными обновлениями',
				pt: 'Número de adaptadores com atualizações disponíveis',
				nl: 'Aantal adapters met beschikbare updates',
				fr: "Nombre d'adaptateurs avec mises à jour disponibles",
				it: 'Numero di adattatori con aggiornamenti disponibili',
				es: 'Número de adaptadores con actualizaciones disponibles',
				pl: 'Liczba adapterów z dostępnymi aktualizacjami',
				uk: 'Кількість адаптерів з доступними оновленнями',
				'zh-cn': '具有可用更新的适配器数量',
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
 *
 * @param adaptr
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
 *
 * @param adaptr
 * @param adapterUpdateListDP
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
