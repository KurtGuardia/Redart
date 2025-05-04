'use client'

import LoginForm from '../../components/login/LoginForm'
import Spots from '../../components/ui/Spots'

export default function Login() {
  return (
    <>
      <Spots count={5} />
      <div className='mx-auto max-w-md my-24 container bg-white rounded-lg shadow-md overflow-hidden'>
        <LoginForm />
      </div>
    </>
  )
}
