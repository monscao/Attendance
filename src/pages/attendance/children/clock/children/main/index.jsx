/*
* @Date: 2021-05-11
* @Descrription: 考勤主页面 
*/
import React, { Component } from 'react';
import API from '../../../../../api/api';
import { Modal, Button } from 'antd-mobile';
import { Toast } from '@/pages/project/yjpt/components/PandaToast.jsx';
import moment from 'moment';
import './main.less';

import icon_modal from '@/asset/image/xian/attendance/icon_modal.png';
import background_blue from '@/asset/image/xian/attendance/background_blue.png';
import background_yellow from '@/asset/image/xian/attendance/background_yellow.png';
import background_gray from '@/asset/image/xian/attendance/background_gray.png';
import icon_success from '@/asset/image/xian/attendance/icon_success.png';
import icon_warning from '@/asset/image/xian/attendance/icon_warning.png';

class main extends Component {
    state = {
        name: '',
        content: '',
        distance: 10000,
        background: null,
        icon: icon_success,
        prompt: '当前不在打卡范围内:',
        current: moment().format("HH:mm:ss"),
        currentPosition: '',
        inRange: false,
        status: 'unusual',
        result: '',
        modal: false
    }
    componentWillReceiveProps(nextProps) {
        this.allowReq = true;
        const { name, timeStatus, distance, currentPosition, range } = nextProps;
        this.updateState(name, timeStatus, distance, currentPosition, range);
    }
    componentDidMount() {
        if (this.props.name) {
            const { name, timeStatus, distance, currentPosition, range } = this.props;
            this.updateState(name, timeStatus, distance, currentPosition, range);
        }
        this.timer = setInterval(() => {
            this.setState({ current: moment().format("HH:mm:ss") });
        }, 1000)
    }
    componentWillUnmount() {
        this.timer && clearInterval(this.timer);
    }
    updateState(name, timeStatus, distance, currentPosition, range) {
        let content = '', background = null, prompt = '已进入考勤范围:', icon =  icon_success, result ='';
        switch (timeStatus) {
            case '正常上班':
                content = '上班打卡';
                result = '上班打卡成功';
                break;
            case '正常下班':
                content = '下班打卡';
                result = '下班打卡成功';
                break;
            case '超出':
                content = '未在打卡时间内';
                break;
            case '迟到':
                content = '上班打卡';
                result = '迟到打卡成功';
                break;
            case '早退':
                content = '下班打卡';
                result = '早退打卡成功';
                break; 
            default:
                content = '';
                break;
        }
        if (distance > range) {
            background = background_gray;
            icon = icon_warning;
            prompt = '当前不在打卡范围内';
            this.setState({ status: 'unusual' });
        } else {
            switch (timeStatus) {
                case '正常上班':
                    background = background_blue;
                    this.setState({ status: 'normal' });
                    break;
                case '正常下班':
                    background = background_blue;
                    this.setState({ status: 'normal' });
                    break;
                case '超出':
                    background = background_gray;
                    break;
                case '迟到':
                    background = background_yellow;
                    this.setState({ status: 'normal' });
                    break;
                case '早退':
                    background = background_yellow;
                    this.setState({ status: 'normal' });
                    break; 
                default:
                    background = background_gray;
                    break;
            }
        }
        this.setState({ name, content, background, icon, prompt, currentPosition, inRange: distance <= range, result });
    }
    add() {
        if (this.props.timeStatus === '早退') {
            this.confirm();
        } else {
            this.beforeAdd();
        }
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
    beforeAdd() {
        if (this.allowReq) {
            this.addAttendance();
            this.allowReq = false;
        }
    }
    addAttendance = async() => {
        let me = this;
        let map = new window.AMap.Map('main', {
            mapStyle: 'amap://styles/275ced74b3a5e9bae7a61a05cbe80f55',
            zooms: [1, 30]
        });
        let terminal = this.MercatorWeblonLat(this.props.configData['打卡位置']);
        let positionFirst = null, positionSecond = null;
        AMap.plugin('AMap.Geolocation', function() {
            let geolocation = new AMap.Geolocation({
                enableHighAccuracy: true,//是否使用高精度定位，默认:true
                timeout: 10000,          //超过10秒后停止定位，默认：无穷大
                maximumAge: 0,           //定位结果缓存0毫秒，默认：0
                convert: true,           //自动偏移坐标，偏移后的坐标为高德坐标，默认：true
                showButton: true,        //显示定位按钮，默认：true
                buttonPosition: 'LB',    //定位按钮停靠位置，默认：'LB'，左下角
                buttonOffset: new AMap.Pixel(10, 20),//定位按钮与设置的停靠位置的偏移量，默认：Pixel(10, 20)
                showMarker: true,        //定位成功后在定位到的位置显示点标记，默认：true
                showCircle: true,        //定位成功后用圆圈表示定位精度范围，默认：true
                panToLocation: true,     //定位成功后将定位到的位置作为地图中心点，默认：true
                zoomToAccuracy: true,      //定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
                useNative: true           //是否使用高德定位sdk用来辅助优化定位效果，默认：false.仅供在使用了高德定位sdk的APP中，嵌入webview页面时使用
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
            geolocation.getCurrentPosition(async function(status, result){
                if (status=='complete'){
                    positionFirst = new AMap.Marker({
                        map: map,
                        position: new AMap.LngLat(result.position.lng, result.position.lat)
                    });
                    positionSecond = new AMap.Marker({
                        map: map,
                        position: new AMap.LngLat(terminal.lng, terminal.lat)
                    });
                    let p1 = positionFirst.getPosition(), p2 = positionSecond.getPosition();
                    let distance = Math.round(p1.distance(p2));

                    let current = moment().format("YYYY-MM-DD HH:mm:ss");
                    if (me.state.status !== 'unusual' && distance < me.props.range) {
                        let params = {
                            Name: me.state.name,
                            Types: me.state.content === '上班打卡' ? '上班' : '下班',
                            Position: me.state.currentPosition,
                            ClockIn: current,
                            CardTime: moment().format("YYYY-MM-DD")
                        }
                        Toast.loading('正在加载中...');
                        let res = await API.AddOrUpdateAttendance({ data: params });
                        Toast.hide();
                        if (res.statusCode === '0000') {
                            me.props.goToResult(me.state.result, moment(new Date(current)).format('HH:mm:ss'));
                        } else {
                            Toast.warn('新增打卡记录失败');
                        }
                    } else {
                        me.props.getDistance();
                        Toast.warn('当前不在打卡范围内!')
                    }
                } else {
                    Toast.warn("定位失败");
                    alert(JSON.stringify(result))
                }
            });
        });
    }
    goToRange() {
        this.props.prop.history.push({
            pathname: '/range',
            query: {
                terminal: this.props.terminal,
                configData: this.props.configData
            }
        })
    }
    showModal(key) {
        this.setState({
          [key]: true,
        });
      }
    onClose(key) {
        this.setState({
            [key]: false,
        });
    }
    confirm() {
        this.showModal('modal');
    }
    continueAdd() {
        this.beforeAdd();
        this.onClose('modal');
    }
    render() {
        let { content, background, icon, prompt, current, currentPosition, inRange, modal } = this.state;
        return (
            <div className="main-container">
                <div 
                    className="butt-container" 
                    style={{ backgroundImage: `url(${ background })` }}
                    onClick={ () => { this.add() } }>
                    <span>{ content }</span><br/>
                    <span>{ current }</span>
                </div>
                <span className="text-container" style={{ marginLeft: !inRange && '0.5rem' }}>
                    <img src={ icon }/>
                    <span>{ prompt }</span>
                    {
                        inRange && <span>{ currentPosition }</span>
                    }
                    {
                        !inRange && <a onClick={() => this.goToRange()}>, 查看范围</a>
                    }
                </span>
                <div id="main"></div>
                <Modal
                    className="modal-style"
                    visible={ modal }
                    transparent
                    maskClosable={ false }
                    onClose={() => {} }
                    title=""
                    footer={[
                        { text: '取消', onPress: () => { this.onClose('modal') } },
                        { text: '继续打卡', onPress: () => { this.continueAdd() } }]}
                    wrapProps={{ onTouchStart: this.onWrapTouchStart }}>
                    <div className="modal-container">
                        <img src={ icon_modal }/>
                        <span>温馨提示</span><br/>
                        <span>未到打卡时间，确定要继续打卡吗?</span>
                    </div>
                </Modal>
            </div>
        );
    }
}
export default main;