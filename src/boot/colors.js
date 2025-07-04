import { boot } from 'quasar/wrappers'
import { setCssVar } from 'quasar'

export default boot(({ app }) => {

  setCssVar('primary', '#7e7e8e'); // 629b8c

  setCssVar('brand', '#4e5dd4'); // 629b8c
  setCssVar('brandDark', '#3f49a9'); // 629b8c

  setCssVar('secondary', '#8c8269'); // 629b8c
  setCssVar('accent', '#3f49a9'); // a0d2d3
  setCssVar('dark', '#2d2d2d');
  setCssVar('positive', '#8CB272');
  setCssVar('negative', '#9B6273');
  setCssVar('info', '#626F9B');
  setCssVar('warning', '#9B8C62');
  setCssVar('dark-page', '#212121');
  //setCssVar('light', '#9B9B9B');

})
