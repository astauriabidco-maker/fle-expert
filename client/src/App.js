"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_router_dom_1 = require("react-router-dom");
var AuthContext_1 = require("./contexts/AuthContext");
var BrandProvider_1 = require("./contexts/BrandProvider");
var ProtectedRoute_1 = require("./components/ProtectedRoute");
var LoginPage_1 = require("./components/LoginPage");
var CandidateDashboard_1 = require("./components/CandidateDashboard");
// import ExercisePlayer from './components/ExercisePlayer';
function App() {
    return (<AuthContext_1.AuthProvider>
      <BrandProvider_1.BrandProvider>
        <react_router_dom_1.BrowserRouter>
          <react_router_dom_1.Routes>
            {/* Public Routes */}
            <react_router_dom_1.Route path="/login" element={<LoginPage_1.default />}/>

            {/* Protected Routes */}
            <react_router_dom_1.Route element={<ProtectedRoute_1.default />}>
              <react_router_dom_1.Route path="/" element={<CandidateDashboard_1.default />}/>

              {/* Future Protected Routes */}
              {/* <Route path="/exercise/:id" element={<ExercisePlayer />} /> */}
            </react_router_dom_1.Route>

            {/* Redirect unknown routes to home (which is protected, so will redirect to login if not auth) */}
            <react_router_dom_1.Route path="*" element={<react_router_dom_1.Navigate to="/" replace/>}/>
          </react_router_dom_1.Routes>
        </react_router_dom_1.BrowserRouter>
      </BrandProvider_1.BrandProvider>
    </AuthContext_1.AuthProvider>);
}
exports.default = App;
