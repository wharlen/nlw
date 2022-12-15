import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import {z} from 'zod';
import ShortUniqueId from 'short-unique-id';

import { authenticate } from '../plugins/authenticate';
import { userRoutes } from './user';

export async function poolRoutes(fastify  : FastifyInstance){
    
    fastify.get('/polls/count', async () =>{
        const count = await prisma.pool.count();

        return {count};
    });

    fastify.post('/polls', async (request, reply) =>{
        const createPoolBody = z.object({
            title:z.string(),
        })
        
        const {title} = createPoolBody.parse(request.body);

        const generate = new ShortUniqueId({length:6})
        const code = String(generate()).toUpperCase();

        let ownerId = null;

        try {
            await request.jwtVerify();

            await prisma.pool.create({
                data:{
                    title,
                    code,
                    ownerId: request.user.sub,
                    participants:{
                        create:{
                            userId: request.user.sub,
                        }
                    }
                },
            })
        } catch (error) {
            await prisma.pool.create({
                data:{
                    title,
                    code: code,
                }
            })
        }

        return reply.status(201).send({code})
    });

    fastify.post('/polls/join', 
    {onRequest: [authenticate]}, 
    async (request, reply) => {
        const joinPollBody = z.object({
            code:z.string(),
        })
        
        const {code} = joinPollBody.parse(request.body);

        const poll = await prisma.pool.findUnique({
            where:{
                code,
            },
            include:{
                participants: {
                    where:{
                        userId: request.user.sub
                    }
                }
            }
        });

        if(!poll){
            return reply.status(400).send({
                message: 'Poll not found',
            });
        }

        if(poll.participants.length > 0){
            return reply.status(400).send({
                message: 'You\'ve already joined this poll',
            });
        }

        if(!poll.ownerId){
            await prisma.pool.update({
                where:{
                    id: poll.id
                },
                data:{
                    ownerId: request.user.sub
                }
            });
        }

        await prisma.participant.create({
            data:{
                poolId: poll.id,
                userId: request.user.sub
            }
        });

        return reply.status(200).send();
    })

    fastify.get('/polls', {onRequest: [authenticate]}, 
    async (request) =>{
        const polls = await prisma.pool.findMany({
            where:{
                participants:{
                    some:{
                        userId: request.user.sub
                    }
                }
            },
            include:{
                //fazendo o count de participantes do bolão
                _count:{
                    select:{
                        participants:true
                    }
                },
                //trazendo 4 participantes com seus avatares
                participants:{
                    select:{
                        id:true,
                        user:{
                            select:{
                                avatarUrl:true
                            }
                        }
                    },
                    take:4,
                },
                //trazendo dados a mais para a interface
                owner:{
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        return {polls};
    });

    fastify.get('/polls/:pollId', {onRequest: [authenticate]},
    async (request, reply) => {
        const getPollParams = z.object({
            pollId: z.string()
        })

        const {pollId} = getPollParams.parse(request.params);

        const poll = await prisma.pool.findFirst({
            where:{
                id: pollId,
                participants:{
                    some:{
                        userId: request.user.sub,
                    }
                }
            },
            include:{
                //fazendo o count de participantes do bolão
                _count:{
                    select:{
                        participants:true
                    }
                },
                //trazendo 4 participantes com seus avatares
                participants:{
                    select:{
                        id:true,
                        user:{
                            select:{
                                avatarUrl:true
                            }
                        }
                    },
                    take:4,
                },
                //trazendo dados a mais para a interface
                owner:{
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if(!poll){
            return reply.status(400).send({
                message: 'Poll not found'
            })
        }

        return {poll};
    });


}