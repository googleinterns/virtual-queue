import firebase from "firebase";
import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import Login from "../views/Login.vue";
import SignUp from "../views/SignUp.vue";
import Search from "../views/Search.vue";
import Queue from "../views/Queue.vue";
import Error404 from "../views/404.vue"

Vue.use(VueRouter);

const routes = [
  {
    path: "/home",
    name: "Home",
    component: Home,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
  },
  {
    path: "/sign-up",
    name: "SignUp",
    component: SignUp,
  },
  {
    path: "/search",
    name: "Search",
    component: Search,
  },
  {
    path: "/queue/:StoreId",
    name: "Queue",
    component: Queue,
  },
  {
    path: "/404",
    name: "Path Not Found",
    component: Error404,
  },
  {
    path: "/",
    redirect: "/search"
  },
  {
    path: "*",
    redirect: "/404",
  },
];

const router = new VueRouter({
  routes,
});

router.beforeEach((to, from, next) => {
  const currentUser = firebase.auth().currentUser;
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  if (requiresAuth && !currentUser) next({ name: "Login" });
  else next();
});
export default router;
