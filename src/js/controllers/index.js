export default class IndexController {
      constructor(app, router, params){
      }
      onRoute(){
          //console.log('IndexController onRoute()', this.router.urlParams)
      }
      onRouteDestroy(){
          //console.log('IndexController onRouteDestroy()')
      }
  }
  window.IndexController = IndexController
  