class LoanCountService {
  static $inject = ["$http"];
  constructor($http) {
    this.$http = $http;
  }
  getLoanCount() {
    const jwt = this.getJwt();
    if (jwt) {
      const headers = {
        Authorization: `Bearer ${jwt}`,
      };
      return this.$http.get("http://localhost:8000/loan-count", { headers });
    }
  }
  getJwt() {
    let jwt = window.sessionStorage.getItem("primoExploreJwt") ?? "";
    // not really sure why the string is stored with enclosing quotes,
    // but they need to be removed
    jwt = jwt.replace(/^"(.*)"$/, "$1");
    return jwt;
  }
}

const PrmSearchBookmarkFilterAfterComponent = {
  controller: class {
    static $inject = ["loanCountService"];
    constructor(loanCountService) {
      this.loanCountService = loanCountService;
    }
    $onInit() {
      this.loanCountService.getLoanCount().then((res) => {
        let loanCount = res.data.loanCount;
        if (loanCount > 99) loanCount = "99+";
        this.loanCount = loanCount.toString();
      });
    }
  },
  template: `
    <p>
      <span ng-if='$ctrl.loanCount' style='color:green;
                                           background-color:white;
                                           border-radius:50%;
                                           display:inline-block;
                                           text-align:center;
                                           vertical-align:middle;
                                           font-weight:bold;
                                           margin-top:0.5em;
                                           margin-left:1em;
                                           height:1.4em;
                                           width:1.7em;
                                           cursor:default;'>
        {{$ctrl.loanCount}}
        <md-tooltip>{{$ctrl.loanCount}} items checked out</md-tooltip>
      </span>
    </p>`,
};

angular
  .module("viewCustom", [])
  .service("loanCountService", LoanCountService)
  .component(
    "prmSearchBookmarkFilterAfter",
    PrmSearchBookmarkFilterAfterComponent
  );
