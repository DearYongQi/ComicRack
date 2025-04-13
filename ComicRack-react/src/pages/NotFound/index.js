import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import './style.scss';

/**
 * 404页面组件
 * 当访问不存在的路由时显示
 * @returns {React.ReactElement} 404页面组件
 */
const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="not-found-container">
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在。"
        extra={
          <Button 
            type="primary" 
            onClick={() => navigate('/')}
          >
            返回首页
          </Button>
        }
      />
    </div>
  );
};

export default NotFound; 