
import Image from 'next/image';
import logoImg from '../assets/logo.svg';
import usersAvatarExampleImg from '../assets/users-avatar-example.png';
import appPreviewImg from '../assets/app-nlw-copa-preview.png';
import iconCheckImg from '../assets/icon-check.svg';
import { api } from '../lib/axios';
import { FormEvent, useState } from 'react';

interface HomeProps {
  pollCount: number;
  guessCount:number;
  userCount: number;
}

export default function Home(props:HomeProps) {

  const [pollTitle, setPollTitle] = useState('')

  async function createPoll(event: FormEvent){
    event.preventDefault();

    try {
      const response = await api.post('polls', {
        title: pollTitle
      })

      const {code } = response.data;

      await navigator.clipboard.writeText(code);

      alert('Bolão criado com sucesso, o código foi copiado para a área de transferência')
      
      setPollTitle('')
    } catch (error) {
      console.log(error)
      alert('Falha ao criar o bolão, tente novamente!')
    }
      
  }

  return (
    <div className="max-w-[1124px] h-screen mx-auto grid grid-cols-2 gap-28 items-center">
      <main>
        <Image src={logoImg} alt="NLW Copa"/>
        <h1 className='mt-14 text-white text-5xl font-bold leading-tight'>
          Crie seu proprio bolão da copa e compartilhe entre amigos!
        </h1>
        <div className='mt-10 flex items-center gap-2'>
          <Image src={usersAvatarExampleImg} alt=""/>
          <strong className='text-gray-100 text-xl'>
            <span className='text-ignite-500'>+ {props.userCount}</span> pessoas já estão usando
          </strong>
        </div>

        <form onSubmit={createPoll} className="mt-10 flex gap-2">
          <input
          className='flex-1 px-6 py-4 rounded bg-gray-800 border border-gray-600 text-sm text-gray-200'
          type="text"
          required
          placeholder="Qual nome do seu bolão?"
          onChange={event => setPollTitle(event.target.value)}
          value={pollTitle}
          />
          <button 
          className='bg-yellow-500 px-6 py-4 rounded text-gray-900 font-bold text-sm uppercase hover:bg-yellow-700' 
          type='submit'>Criar bolão</button>
        </form>
        <p className='mt-4 text-sm text-gray-300 leading-relaxed'>
          Após criar seu bolao, voce recebera um código único que poderá compartilhar com seus amigos!
        </p>
        <div className='mt-10 pt-10 border-t border-gray-600 flex items-center justify-between text-gray-100'>
          <div className='flex items-center gap-6'>
            <Image src={iconCheckImg} alt=""/>
            <div className='flex flex-col'>
              <span className='font-bold text-2xl'>+{props.pollCount}</span>
                <span>Bolões criados</span>
            </div>
          </div>

          <div className='w-px h-14 bg-gray-600'></div>

          <div className='flex items-center gap-6'>
            <Image src={iconCheckImg} alt=""/>
            <div className='flex flex-col'>
              <span className='font-bold text-2xl'>+{props.guessCount}</span>
                <span>Palpites criados</span>
            </div>
          </div>
        </div>
      </main>
      <Image src={appPreviewImg} quality={100}/>
    </div>
  )
}

export const getServerSideProps = async () => {
  const [pollCountResponse, guessCountResponse, userCountResponse] = await Promise.all([
    api.get('polls/count'),
    api.get('guesses/count'),
    api.get('users/count')
  ])
  return {
    props:{
      pollCount: pollCountResponse.data.count,
      guessCount: guessCountResponse.data.count,
      userCount: userCountResponse.data.count,
    }
  }
}