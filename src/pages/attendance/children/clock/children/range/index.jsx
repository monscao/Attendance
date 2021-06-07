/*
 * @Date: 2021-05-11
 * @Description: 查看范围
 */
import React, { Component } from 'react';
import './range.less';

import icon_map_location  from '@/asset/image/xian/attendance/icon_map_location.png';
import icon_range_position from '@/asset/image/xian/attendance/icon_range_position.png';

class range extends Component {
    state = {
        terminal: '',
        currentLocation: ''
    }
    MercatorWeblonLat(mercator) {
        let x = mercator.split(',')[0],
            y = mercator.split(',')[1];
        let lng = x / 20037508.34 * 180;
        let lat = y / 20037508.34 * 180;
        lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
        return {
            lng: lng,
            lat: lat
        };
    }
    componentDidMount() {
        let me = this;
        this.setState({ terminal: this.props.location.query.terminal });
        let geoLocation = this.MercatorWeblonLat(this.props.location.query.configData['打卡位置']);
        let map = new window.AMap.Map('map', {
            mapStyle: 'amap://styles/21dd5fbddf5887f5b5e74366b005f3a7'
        });
        let options = {
            'showButton': true,//是否显示定位按钮
            'buttonPosition': 'RT',
            'showMarker': true,//是否显示定位点
            'markerOptions':{//自定义定位点样式，同Marker的Options
              'offset': new AMap.Pixel(-18, -36),
              'content':'<img src="https://a.amap.com/jsapi_demos/static/resource/img/user.png" style="width:36px;height:36px"/>'
            },
            'showCircle': false,//是否显示定位精度圈
            'circleOptions': {//定位精度圈的样式
                'strokeColor': '#0093FF',
                'noSelect': true,
                'strokeOpacity': 0.5,
                'strokeWeight': 1,
                'fillColor': '#02B0FF',
                'fillOpacity': 0.25
            },
            'useNative': true
        }
        map.setZoom(16);
        AMap.plugin(["AMap.Geolocation"], function() {
            var geolocation = new AMap.Geolocation(options);
            map.addControl(geolocation);
            geolocation.getCurrentPosition();
        });
        let startMarker = new AMap.Marker({
            position: new AMap.LngLat(geoLocation.lng, geoLocation.lat),
            icon: icon_map_location,
            offset: new AMap.Pixel(-19, -19)
        });
        map.add(startMarker);
        AMap.plugin('AMap.Geolocation', function() {
            let geolocation = new AMap.Geolocation({
                showButton: false,
                enableHighAccuracy: true,//是否使用高精度定位，默认:true
                timeout: 10000,          //超过10秒后停止定位，默认：无穷大
                maximumAge: 0,           //定位结果缓存0毫秒，默认：0
                convert: true,           //自动偏移坐标，偏移后的坐标为高德坐标，默认：true,
                showCircle: false,
                showMarker: false,
                buttonPosition: 'RT',
                useNative:true           //是否使用高德定位sdk用来辅助优化定位效果，默认：false.仅供在使用了高德定位sdk的APP中，嵌入webview页面时使用
            });
            if (window.AMap.UA.ios) { 
              //使用远程定位，见 remogeo.js
               let remoGeo = new window.RemoGeoLocation(); 
              //替换方法
              navigator.geolocation.getCurrentPosition = function () {
                  return remoGeo.getCurrentPosition.apply(remoGeo, arguments); 
              }; 
              //替换方法 
              navigator.geolocation.watchPosition = function() { 
                  return remoGeo.watchPosition.apply(remoGeo, arguments);
               };
           }
            map.addControl(geolocation);
            geolocation.getCurrentPosition(function(status, result){
                if (status=='complete'){
                    let geocoder = new AMap.Geocoder({ city: '全国' })
                    let lnglat = [result.position.lng, result.position.lat]
                    geocoder.getAddress(lnglat, function (status, result) {
                        if (status === 'complete' && result.info === 'OK') {
                            me.setState({ currentLocation: result.regeocode.formattedAddress });
                        }
                    })
                } else {
                    Toast.fault("定位失败");
                    alert(JSON.stringify(result))
                }
            });
            me.timer && clearInterval(me.timer);
            me.timer = setInterval(() => {
                geolocation.getCurrentPosition(function(status, result){
                    if (status=='complete'){
                        let geocoder = new AMap.Geocoder({ city: '全国' })
                        let lnglat = [result.position.lng, result.position.lat]
                        geocoder.getAddress(lnglat, function (status, result) {
                            if (status === 'complete' && result.info === 'OK') {
                                me.setState({ currentLocation: result.regeocode.formattedAddress });
                            }
                        })
                    } else {
                        Toast.fault("定位失败", 1)
                    }
                });
            }, 5000)
        });
        AMap.plugin('AMap.Geolocation', function() {
            let geolocation = new AMap.Geolocation({
                showButton: true,
                buttonPosition: 'RT',
                enableHighAccuracy: true,//是否使用高精度定位，默认:true
                timeout: 10000,          //超过10秒后停止定位，默认：无穷大
                maximumAge: 0,           //定位结果缓存0毫秒，默认：0
                convert: true,           //自动偏移坐标，偏移后的坐标为高德坐标，默认：true,
                showCircle: false,
                showMarker: false,
                buttonPosition: 'RT',
                useNative:true           //是否使用高德定位sdk用来辅助优化定位效果，默认：false.仅供在使用了高德定位sdk的APP中，嵌入webview页面时使用
            });
            map.addControl(geolocation);
            geolocation.getCurrentPosition(function(status, result){
                if (status=='complete'){
                    let geocoder = new AMap.Geocoder({ city: '全国' })
                    let lnglat = [result.position.lng, result.position.lat]
                    geocoder.getAddress(lnglat, function (status, result) {
                        if (status === 'complete' && result.info === 'OK') {
                            me.setState({ currentLocation: result.regeocode.formattedAddress });
                        }
                    })
                } else {
                    Toast.fault("定位失败", 1)
                }
            });
        });
    }
    render() {
        let { terminal, currentLocation  } = this.state;
        return (
            <div className="range-container">
                <div id="map" className="map-container"></div>
                <div className="infos-container">
                    <span>我的定位</span><br/>
                    <span>
                        <img src={ icon_range_position }/>
                        { currentLocation }
                    </span><br/>
                    <span>打卡范围: { terminal } 800米范围内</span>
                </div>
            </div>
        )
    }
}

export default range;