/*
 * @Date: 2021-05-11
 * @Description: 考勤打卡
 */
import React, { Component } from 'react';
import Clock from './children/clock';
import Statistics from './children/statistics';
import Setting from './children/setting';
import './attendance.less';

import icon_attendance_blue from '@/asset/image/xian/attendance/icon_attendance_blue.png';
import icon_attendance_gray from '@/asset/image/xian/attendance/icon_attendance_gray.png';
import icon_statistics_blue from '@/asset/image/xian/attendance/icon_statistics_blue.png';
import icon_statistics_gray from '@/asset/image/xian/attendance/icon_statistics_gray.png';
import icon_setting_blue from '@/asset/image/xian/attendance/icon_setting_blue.png';
import icon_setting_gray from '@/asset/image/xian/attendance/icon_setting_gray.png';

class attendance extends Component {
    state = {
        menu: 'clock',
        isManager: false
    }
    componentWillMount() {
        let infos = JSON.parse(sessionStorage.getItem("attendanceInfos"));
        if (infos) {
            this.setState({ menu: infos.father });
            sessionStorage.removeItem("attendanceInfos");
        }
        this.props.history.listen(location => {
            location.params && this.setState({ menu: location.params.tab });
            if (location.pathname == '/@tab0') {
                sessionStorage.removeItem("attendanceInfos");
                localStorage.removeItem('dateInfos');
            }
        })
        let userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
        userInfo && userInfo.roles.forEach(item => {
            if (item.name === '考勤管理员') {
                this.setState({ isManager: true });
            }
        })
    }
    componentDidMount() {
        window.addEventListener('popstate', this.backMainMenu, false);
    }
    backMainMenu() {
        // history.pushState({}, null, '/MobileGCK/@tab0/'); //安卓端不支持
        window.location.href = '/MobileGCK/@tab0/';
    }
    componentWillUnmount() {
        window.removeEventListener('popstate', this.backMainMenu, false);
    }
    render() {
        let { menu, isManager } = this.state;
        let element = null;
        switch (menu) {
            case 'clock':
                element = <Clock prop={ this.props }/>;
                break;
            case 'statistics':
                element = <Statistics prop={ this.props }/>
                break;
            case 'setting':
                element = <Setting prop={ this.props }/>
                break;
            default:
                break;
        }
        return (
            <div className="total-container">
                <div className="content-container">
                    { element }
                </div>
                <div className="footer-container">
                    <div style={{ width: isManager ? '31%' : '47%' }} onClick={ () => { this.switchMenu("clock"); } }>
                        <img src={ menu === 'clock' ? icon_attendance_blue : icon_attendance_gray  } alt="" />
                        <span>打卡</span>
                    </div>
                    <div style={{ width: isManager ? '31%' : '47%' }} onClick={ () => { this.switchMenu("statistics"); } }>
                        <img src={ menu === 'statistics' ? icon_statistics_blue : icon_statistics_gray  } alt="" />
                        <span>统计</span>
                    </div>
                    {
                        isManager && 
                        <div onClick={ () => { this.switchMenu("setting"); } }>
                            <img src={ menu === 'setting' ? icon_setting_blue : icon_setting_gray  } alt="" />
                            <span>设置</span>
                        </div>
                    }
                </div>
            </div>
        );
    }
    switchMenu(tab) {
        localStorage.removeItem('dateInfos');
        this.props.history.push({ pathname: '/attendance', params: { tab } });
    }
}
export default attendance;
