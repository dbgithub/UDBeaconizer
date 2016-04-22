cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/cordova-plugin-ble/ble.js",
        "id": "cordova-plugin-ble.BLE",
        "pluginId": "cordova-plugin-ble",
        "clobbers": [
            "evothings.ble"
        ]
    },
    {
        "file": "plugins/cordova-plugin-eddystone/js/eddystone-plugin.js",
        "id": "cordova-plugin-eddystone.eddystoneplugin",
        "pluginId": "cordova-plugin-eddystone",
        "clobbers": [
            "evothings.eddystone"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-ble": "1.0.1",
    "cordova-plugin-eddystone": "1.1.0",
    "cordova-plugin-whitelist": "1.2.1"
}
// BOTTOM OF METADATA
});