import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from '../entities/agent.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
  ) {}

  async create(createAgentDto: CreateAgentDto) {
    const agent = this.agentRepository.create(createAgentDto);
    return this.agentRepository.save(agent);
  }

  async findAll() {
    return this.agentRepository.find();
  }

  async findOne(id: number) {
    return this.agentRepository.findOne({ where: { id } });
  }

  async update(id: number, updateAgentDto: UpdateAgentDto) {
    await this.agentRepository.update(id, updateAgentDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.agentRepository.delete(id);
    return { deleted: true };
  }
}