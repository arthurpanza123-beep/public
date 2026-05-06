const ANDROID_DEVICES = ['Android TV', 'TV Box', 'Fire Stick', 'Mi Stick', 'Android'];
const STORE_DEVICES = ['LG', 'Samsung', 'Roku', 'iPhone/iOS'];

const devices = [
  'LG',
  'Samsung',
  'Roku',
  'Android TV',
  'TV Box',
  'Fire Stick',
  'Mi Stick',
  'Android',
  'iPhone/iOS'
];

const apps = [
  {
    id: 'blessed',
    name: 'Blessed Player',
    code: '00867',
    downloader: '6390937',
    ntDown: '',
    directLink: 'https://fui.ai/blessedmobile',
    devices: ['LG', 'Samsung', 'Android TV', 'TV Box', 'Fire Stick', 'Mi Stick', 'Roku', 'iPhone/iOS']
  },
  {
    id: 'core',
    name: 'Core Player',
    code: '999',
    downloader: '904692',
    ntDown: '17817',
    directLink: 'https://dl.ntdev.in/17817',
    devices: ['LG', 'Samsung', 'Android TV', 'TV Box', 'Fire Stick', 'Mi Stick', 'Roku']
  },
  {
    id: 'magic',
    name: 'Magic Player',
    code: '00867',
    downloader: '8526239',
    ntDown: '',
    directLink: '',
    devices: ['LG', 'Samsung', 'Android TV', 'TV Box', 'Fire Stick', 'Mi Stick', 'Roku']
  },
  {
    id: 'playsim',
    name: 'PlaySim',
    code: '00867',
    downloader: '7275096',
    ntDown: '',
    directLink: '',
    devices: ['LG', 'Samsung', 'Android TV', 'TV Box', 'Fire Stick', 'Mi Stick', 'Roku']
  },
  {
    id: 'epic',
    name: 'Epic Play',
    code: '00867',
    downloader: '9770859',
    ntDown: '',
    directLink: '',
    devices: ['LG', 'Samsung', 'Android TV', 'TV Box', 'Fire Stick', 'Mi Stick', 'Roku']
  },
  {
    id: 'assistplus',
    name: 'AssistPlus',
    code: '00867',
    downloader: '8209473',
    ntDown: '',
    directLink: '',
    devices: ['LG', 'Samsung', 'Android TV', 'TV Box', 'Fire Stick', 'Mi Stick', 'Roku']
  },
  {
    id: 'superplay',
    name: 'Super Play',
    code: '00867',
    downloader: '1774996',
    ntDown: '',
    directLink: '',
    devices: ['LG', 'Samsung', 'Android TV', 'TV Box', 'Fire Stick', 'Mi Stick', 'Roku']
  },
  {
    id: 'powerplay',
    name: 'Power Play',
    code: '00867',
    downloader: '5487022',
    ntDown: '',
    directLink: '',
    devices: ['LG', 'Samsung', 'Android TV', 'TV Box', 'Fire Stick', 'Mi Stick', 'Roku']
  },
  {
    id: 'vizzion',
    name: 'Vizzion Play',
    code: '00867',
    downloader: '5338196',
    ntDown: '',
    directLink: '',
    devices: ['LG', 'Samsung', 'Android TV', 'TV Box', 'Fire Stick', 'Mi Stick', 'Roku']
  },
  {
    id: 'funplay',
    name: 'Fun Play',
    code: '00867',
    downloader: '257286',
    ntDown: '',
    directLink: '',
    devices: ['LG', 'Samsung', 'Android TV', 'TV Box', 'Fire Stick', 'Mi Stick', 'Roku']
  },
  {
    id: 'lazerplay',
    name: 'Lazer Play',
    code: '00867',
    downloader: '9101816',
    ntDown: '',
    directLink: '',
    devices: ['LG', 'Samsung', 'Android TV', 'TV Box', 'Fire Stick', 'Mi Stick', 'Roku']
  },
  {
    id: 'boxplayer',
    name: 'Box Player',
    code: '00867',
    downloader: '7806180',
    ntDown: '',
    directLink: '',
    devices: ['Android TV', 'TV Box', 'Fire Stick', 'Mi Stick', 'Roku']
  }
];

function isAndroidDevice(device) {
  return ANDROID_DEVICES.includes(device);
}

function getAppsForDevice(device) {
  return apps.filter((app) => supportsDevice(app, device));
}

function getAppById(id) {
  return apps.find((app) => app.id === id);
}

function supportsDevice(app, device) {
  if (app.devices.includes(device)) return true;
  if (device === 'Android') return app.devices.includes('Android TV') && Boolean(app.downloader);
  return false;
}

module.exports = {
  devices,
  apps,
  ANDROID_DEVICES,
  STORE_DEVICES,
  isAndroidDevice,
  getAppsForDevice,
  getAppById,
  supportsDevice
};
