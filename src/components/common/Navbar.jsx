import React from 'react'
import { Link, matchPath, useLocation } from "react-router-dom";
import logo from "../../assets/Logo/Logo-Full-Light.png"
import { NavbarLinks } from "../../data/navbar-links"

const Navbar = () => {
  const matchRoute = (route) => {
    return matchPath({ path: route }, location.pathname)
  }
  const location = useLocation();
  return (
    <div
      className={`flex h-14 items-center justify-center border-b-[1px] border-b-richblack-700 ${
        location.pathname !== "/" ? "bg-richblack-800" : ""
      } transition-all duration-200`}
    >
      
    </div>
  )
}

export default Navbar
