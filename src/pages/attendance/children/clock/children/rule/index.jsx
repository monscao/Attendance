/*
 * @Date: 2021-05-11
 * @Description: 打卡规则
 */
import React, { Component } from 'react';
import moment from 'moment';
import './index.less';

import icon_date_yellow from '@/asset/image/xian/attendance/icon_date_yellow.png';
import icon_coordinate_green from '@/asset/image/xian/attendance/icon_coordinate_green.png';
import icon_coordinate_gray from '@/asset/image/xian/attendance/icon_coordinate_gray.png'

class rule extends Component {
    state = {
        period: '',
        terminal: '',
        range: 1000
    }
    render() {
        let { period, terminal, range } = this.state;
        period = this.props.location.query.period;
        terminal = this.props.location.query.terminal;
        range = this.props.location.query.range;
        return (
            <div className="total-container">
                <div className="rule-container">
                    <div className="container-top">
                        <span>
                            <img src={ icon_date_yellow }/>考勤时间
                        </span>
                        <span>上班: 法定工作日</span><br/>
                        <span>下班: 法定节假日</span><br/>
                        <span>上班: { period }</span>
                    </div>
                    <div className="divide-line"></div>
                    <div className="container-bottom">
                        <span>
                            <img src={ icon_coordinate_green }/>打卡范围
                        </span>
                        <span>
                            <img src={ icon_coordinate_gray }/>
                            { terminal + range + '米内' }
                        </span>
                    </div>
                </div>
            </div>
        )
    }
}

export default rule;